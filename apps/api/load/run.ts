import type { ClientToServerEvents, Message, ServerToClientEvents } from '@lokky/shared';
import { inArray, like } from 'drizzle-orm';
import { io, type Socket } from 'socket.io-client';
import { createDatabase } from '../src/db/client';
import { activities, conversationMembers, messages, participations, users } from '../src/db/schema';
import { uuidv7 } from '../src/lib/ids';
import { createGroup } from '../src/modules/chat/groups';
import { createAccessTokens } from '../src/services/accessTokens';

// Test de charge : des centaines de comptes connectés en même temps, qui parcourent Découvrir,
// ouvrent leurs conversations et discutent dans des dizaines de groupes.
//
//   npm run load -- [personnes=300] [groupes=100] [secondes=60]
//
// L'API doit tourner (npm run dev, ou mieux : npm run build && npm start). Les comptes de test
// (…@load.lokky) sont créés au début et supprimés à la fin.

const [USERS = 300, GROUPS = 100, SECONDS = 60] = process.argv.slice(2).map(Number);
const API = process.env.LOAD_API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
const DOMAIN = '@load.lokky';
// Rythme de chaque personne simulée (en ms). LOAD_PACE ralentit tout le monde : 1 = scénario
// extrême (tout le monde actif en continu), 5 = usage soutenu réaliste (une action toutes les
// 20 à 40 s par personne).
const PACE = Number(process.env.LOAD_PACE ?? 1);
const FEED_EVERY = 4_000 * PACE;
const CONVERSATIONS_EVERY = 6_000 * PACE;
const MESSAGE_EVERY = 8_000 * PACE;

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

const latencies = new Map<string, number[]>();
const errors = new Map<string, number>();
const deliveries: number[] = [];
let sent = 0;

function record(name: string, ms: number, ok: boolean) {
  if (ok) latencies.set(name, [...(latencies.get(name) ?? []), ms]);
  else errors.set(name, (errors.get(name) ?? 0) + 1);
}

async function call(name: string, token: string, method: string, path: string, body?: unknown) {
  const start = performance.now();
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    await res.arrayBuffer();
    record(name, performance.now() - start, res.ok);
  } catch {
    record(name, performance.now() - start, false);
  }
}

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!;
};
const ms = (n: number) => `${Math.round(n)} ms`.padStart(8);
const sleep = (n: number) => new Promise((r) => setTimeout(r, n));
const jitter = (n: number) => n * (0.5 + Math.random());

async function main() {
  const url = process.env.DATABASE_URL;
  const key = process.env.JWT_PRIVATE_KEY;
  if (!url || !key) throw new Error('DATABASE_URL et JWT_PRIVATE_KEY sont nécessaires (.env).');
  const database = createDatabase(url, { max: 5 });
  const db = database.db;
  const tokens = await createAccessTokens(key);
  const now = new Date();

  await cleanup(db);
  console.log(`Préparation : ${USERS} personnes, ${GROUPS} groupes…`);

  // Comptes de test, inscrits, autour de Dakar.
  const people = Array.from({ length: USERS }, (_, i) => ({
    id: uuidv7(now.getTime()),
    email: `charge${i}${DOMAIN}`,
    firstName: `Test${i}`,
    birthDate: '2000-01-01',
    status: 'student' as const,
    neighborhood: 'fann' as const,
    interests: ['sport' as const, 'beach' as const, 'music' as const],
    onboardedAt: now,
  }));
  for (let i = 0; i < people.length; i += 500)
    await db.insert(users).values(people.slice(i, i + 500));

  // Groupes : une sortie à venir chacun, ~6 personnes par groupe (chacun dans ~2 groupes).
  const groupOf = new Map<string, string[]>(); // personne → conversations
  for (let g = 0; g < GROUPS; g += 1) {
    const creator = people[g % USERS]!;
    const id = uuidv7(now.getTime());
    await db.insert(activities).values({
      id,
      title: `Sortie de charge ${g}`,
      category: 'sport',
      startsAt: new Date(now.getTime() + (2 + (g % 48)) * 3_600_000),
      placeName: 'Corniche Ouest',
      lat: 14.69 + (g % 10) * 0.005,
      lng: -17.47 + (g % 7) * 0.005,
      neighborhood: 'fann',
      capacity: 20,
      costType: 'free',
      creatorId: creator.id,
    });
    const members = [
      creator,
      ...Array.from({ length: 5 }, (_, k) => people[(g * 5 + k + 1) % USERS]!),
    ];
    const unique = [...new Map(members.map((m) => [m.id, m])).values()];
    await db.insert(participations).values(unique.map((m) => ({ activityId: id, userId: m.id })));
    const conversationId = await createGroup(db, id, creator.id, now);
    const others = unique.filter((m) => m.id !== creator.id);
    if (others.length) {
      await db
        .insert(conversationMembers)
        .values(others.map((m) => ({ conversationId, userId: m.id, lastReadAt: now })));
    }
    for (const m of unique) groupOf.set(m.id, [...(groupOf.get(m.id) ?? []), conversationId]);
  }

  // Connexions temps réel : la latence de livraison est mesurée à la réception.
  const tokenOf = new Map<string, string>();
  for (const p of people) tokenOf.set(p.id, await tokens.sign(p.id, uuidv7(), new Date()));
  const sockets: Client[] = [];
  let connected = 0;
  await Promise.all(
    people.map(
      (p) =>
        new Promise<void>((resolve) => {
          const socket: Client = io(API, {
            auth: { token: tokenOf.get(p.id) },
            transports: ['websocket'],
            forceNew: true,
          });
          sockets.push(socket);
          socket.on('connect', () => {
            connected += 1;
            resolve();
          });
          socket.on('connect_error', () => resolve());
          socket.on('message:new', (m: Message) => {
            if (m.sender?.id !== p.id && m.clientId?.startsWith('charge-')) {
              const sentAt = Number(m.clientId.split('-')[1]);
              deliveries.push(Date.now() - sentAt);
            }
          });
        }),
    ),
  );
  console.log(`${connected}/${USERS} connexions temps réel ouvertes. Charge pendant ${SECONDS} s…`);

  // Chaque personne agit à son rythme, en même temps que toutes les autres.
  const end = Date.now() + SECONDS * 1000;
  await Promise.all(
    people.map(async (p, i) => {
      const token = tokenOf.get(p.id)!;
      const groups = groupOf.get(p.id) ?? [];
      let nextFeed = Date.now() + jitter(FEED_EVERY);
      let nextConversations = Date.now() + jitter(CONVERSATIONS_EVERY);
      let nextMessage = Date.now() + jitter(MESSAGE_EVERY);
      let n = 0;
      while (Date.now() < end) {
        const t = Date.now();
        if (t >= nextFeed) {
          await call(
            'Découvrir (fil)',
            token,
            'GET',
            '/activities?lat=14.69&lng=-17.46&radiusKm=25',
          );
          nextFeed = t + jitter(FEED_EVERY);
        }
        if (t >= nextConversations) {
          await call('Liste des conversations', token, 'GET', '/conversations');
          nextConversations = t + jitter(CONVERSATIONS_EVERY);
        }
        if (t >= nextMessage && groups.length) {
          const conversationId = groups[n % groups.length]!;
          n += 1;
          sent += 1;
          await call(
            'Envoi de message',
            token,
            'POST',
            `/conversations/${conversationId}/messages`,
            {
              clientId: `charge-${Date.now()}-${i}-${n}`,
              body: `Message de charge ${n}`,
            },
          );
          nextMessage = t + jitter(MESSAGE_EVERY);
        }
        await sleep(100);
      }
    }),
  );
  await sleep(2000); // derniers messages en vol
  for (const s of sockets) s.disconnect();

  report();
  await cleanup(db);
  await database.close();
}

function report() {
  console.log('\nRésultats');
  console.log(
    'Route'.padEnd(28) +
      'requêtes'.padStart(10) +
      'médiane'.padStart(9) +
      'p95'.padStart(9) +
      'p99'.padStart(9) +
      'erreurs'.padStart(9),
  );
  for (const [name, values] of latencies) {
    console.log(
      name.padEnd(28) +
        String(values.length).padStart(10) +
        ms(percentile(values, 50)).padStart(9) +
        ms(percentile(values, 95)).padStart(9) +
        ms(percentile(values, 99)).padStart(9) +
        String(errors.get(name) ?? 0).padStart(9),
    );
  }
  for (const [name, count] of errors) {
    if (!latencies.has(name)) console.log(`${name.padEnd(28)} ${count} erreurs, aucune réussite`);
  }
  console.log(
    `\nTemps réel : ${sent} messages envoyés, ${deliveries.length} livraisons aux autres membres.`,
  );
  console.log(
    `Délai de livraison : médiane ${ms(percentile(deliveries, 50))}, p95 ${ms(percentile(deliveries, 95))}, p99 ${ms(percentile(deliveries, 99))}`,
  );
}

async function cleanup(db: ReturnType<typeof createDatabase>['db']) {
  const ids = (
    await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, `%${DOMAIN}`))
  ).map((u) => u.id);
  if (ids.length === 0) return;
  await db.delete(messages).where(inArray(messages.senderId, ids));
  await db.delete(activities).where(inArray(activities.creatorId, ids));
  await db.delete(users).where(inArray(users.id, ids));
}

await main();
