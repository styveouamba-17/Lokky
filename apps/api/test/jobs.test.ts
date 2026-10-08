import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pushTokens, sessions, users } from '../src/db/schema';
import { registerJobListeners } from '../src/jobs/listeners';
import { createProcessors, type Processors } from '../src/jobs/processors';
import type { JobName, JobPayloads, JobScheduler } from '../src/jobs/types';
import type { PushMessage, PushSender } from '../src/services/push';
import { createActivity, createMember } from './factories';
import { createTestApp, resetDatabase } from './helpers';

const NOW = new Date('2026-10-07T10:00:00Z');
const H = 3_600_000;
const at = (hours: number) => new Date(NOW.getTime() + hours * H);

interface PlannedJob {
  name: JobName;
  data: JobPayloads[JobName];
  runAt?: Date;
}

// File en mémoire : même règle que BullMQ (un jobId déjà planifié n'est pas recréé).
const planned = new Map<string, PlannedJob>();
let anonymous = 0;
const scheduler: JobScheduler = {
  async schedule(name, data, { runAt, jobId } = {}) {
    const id = jobId ?? `job-${(anonymous += 1)}`;
    if (!planned.has(id)) planned.set(id, { name, data, runAt });
  },
  async cancel(jobId) {
    planned.delete(jobId);
  },
};

const sent: PushMessage[] = [];
let deadTokens: string[] = [];
const push: PushSender = {
  async send(messages) {
    sent.push(...messages);
    return { invalidTokens: messages.filter((m) => deadTokens.includes(m.to)).map((m) => m.to) };
  },
};

let t: Awaited<ReturnType<typeof createTestApp>>;
let clock = NOW;
let processors: Processors;

beforeAll(async () => {
  t = await createTestApp({ now: () => clock });
  registerJobListeners(t.app.events, scheduler, t.db, () => clock);
  processors = createProcessors({ db: t.db, push, now: () => clock });
});
afterAll(() => t.close());
beforeEach(async () => {
  clock = NOW;
  planned.clear();
  sent.length = 0;
  deadTokens = [];
  await resetDatabase(t.db);
});

async function withPhone(member: Awaited<ReturnType<typeof createMember>>, token: string) {
  const res = await member.call('POST', '/me/push-token', { token, platform: 'android' });
  expect(res.statusCode).toBe(200);
  return member;
}

const run = async (jobId: string) => {
  const job = planned.get(jobId);
  if (!job) throw new Error(`Tâche absente : ${jobId}`);
  await (processors[job.name] as (d: unknown) => Promise<void>)(job.data);
};
const runAll = async (name: JobName) => {
  for (const [id, job] of [...planned]) if (job.name === name) await run(id);
};

const NEW_ACTIVITY = (startsAt: Date) => ({
  title: 'Ciné en plein air',
  category: 'cinema',
  startsAt: startsAt.toISOString(),
  location: {
    name: 'Corniche Ouest',
    coordinates: { lat: 14.693, lng: -17.475 },
    neighborhood: 'fann',
    meetingPoint: 'Devant le phare',
  },
  capacity: 6,
  cost: { type: 'free' },
});

describe('sorties : rappel, après-sortie, événements', () => {
  it('créer une sortie planifie le rappel (2 h avant) et l’après-sortie (début + 3 h)', async () => {
    const awa = await createMember(t, 'Awa');
    const { id } = (await awa.call('POST', '/activities', NEW_ACTIVITY(at(26)))).json();
    expect(planned.get(`reminder-${id}`)?.runAt).toEqual(at(24));
    expect(planned.get(`after-${id}`)?.runAt).toEqual(at(29));
    expect(planned.get(`discovery-${id}`)).toMatchObject({
      name: 'activity-discovery',
      data: { activityId: id },
    });
  });

  it('découverte : seuls les membres intéressés reçoivent la notification, quel que soit leur quartier', async () => {
    const creator = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[awa]');
    const matching = await withPhone(
      await createMember(t, 'Fatou', { neighborhood: 'yoff' }),
      'ExponentPushToken[fatou]',
    );
    const notMatching = await withPhone(
      await createMember(t, 'Moussa'),
      'ExponentPushToken[moussa]',
    );
    const optedOut = await withPhone(
      await createMember(t, 'Aminata'),
      'ExponentPushToken[aminata]',
    );
    await t.db
      .update(users)
      .set({ interests: ['sport'] })
      .where(eq(users.id, matching.id));
    await t.db
      .update(users)
      .set({ interests: ['cinema'] })
      .where(eq(users.id, notMatching.id));
    await t.db
      .update(users)
      .set({
        interests: ['sport'],
        preferences: {
          language: 'fr',
          theme: 'system',
          notifications: { messages: true, activityUpdates: false, reminders: true },
        },
      })
      .where(eq(users.id, optedOut.id));
    sent.length = 0;

    const { id } = (
      await creator.call('POST', '/activities', { ...NEW_ACTIVITY(at(26)), category: 'sport' })
    ).json();
    await run(`discovery-${id}`);

    expect(sent).toEqual([
      expect.objectContaining({
        to: 'ExponentPushToken[fatou]',
        title: 'Une sortie pour toi',
        body: '« Ciné en plein air » vient d’être créée dans tes centres d’intérêt. Découvre-la !',
        data: { type: 'activity_discovery', activityId: id },
      }),
    ]);
  });

  it('le rappel part aux participants qui l’ont laissé activé', async () => {
    const awa = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[awa]');
    const fatou = await withPhone(await createMember(t, 'Fatou'), 'ExponentPushToken[fatou]');
    const { id } = (await awa.call('POST', '/activities', NEW_ACTIVITY(at(26)))).json();
    await fatou.call('POST', `/activities/${id}/join`);
    // Fatou coupe les rappels dans ses réglages.
    await t.db
      .update(users)
      .set({
        preferences: {
          language: 'fr',
          theme: 'system',
          notifications: { messages: true, activityUpdates: true, reminders: false },
        },
      })
      .where(eq(users.id, fatou.id));
    sent.length = 0;

    clock = at(24);
    await run(`reminder-${id}`);
    expect(sent).toEqual([
      expect.objectContaining({
        to: 'ExponentPushToken[awa]',
        title: 'Dans 2 h : Ciné en plein air',
        data: { type: 'activity_reminder', activityId: id },
      }),
    ]);
  });

  it('annuler retire les tâches et prévient les participants', async () => {
    const awa = await createMember(t, 'Awa');
    const fatou = await withPhone(await createMember(t, 'Fatou'), 'ExponentPushToken[fatou]');
    const { id } = (await awa.call('POST', '/activities', NEW_ACTIVITY(at(26)))).json();
    await fatou.call('POST', `/activities/${id}/join`);
    await awa.call('POST', `/activities/${id}/cancel`);
    expect(planned.has(`reminder-${id}`)).toBe(false);
    expect(planned.has(`after-${id}`)).toBe(false);
    sent.length = 0;
    await runAll('activity-event');
    expect(sent.map((m) => m.title)).toContain('Sortie annulée');
    expect(sent.every((m) => m.to === 'ExponentPushToken[fatou]')).toBe(true);
  });

  it('« Je viens ! » prévient le créateur', async () => {
    const awa = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[awa]');
    const fatou = await createMember(t, 'Fatou');
    const { id } = (await awa.call('POST', '/activities', NEW_ACTIVITY(at(26)))).json();
    await fatou.call('POST', `/activities/${id}/join`);
    await runAll('activity-event');
    expect(sent).toEqual([
      expect.objectContaining({
        to: 'ExponentPushToken[awa]',
        body: 'Fatou vient à ta sortie !',
        data: { type: 'activity_joined', activityId: id },
      }),
    ]);
  });

  it('après la sortie : avis aux participants, présence au créateur', async () => {
    const moussa = await withPhone(await createMember(t, 'Moussa'), 'ExponentPushToken[moussa]');
    const awa = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[awa]');
    const { id } = await createActivity(t, moussa.id, {
      startsAt: at(-4),
      participantIds: [awa.id],
    });
    await processors['after-activity']({ activityId: id });
    expect(sent.map((m) => [m.to, m.title])).toEqual([
      ['ExponentPushToken[awa]', 'Comment c’était ?'],
      ['ExponentPushToken[moussa]', 'Qui est venu ?'],
    ]);
  });
});

describe('messages', () => {
  it('regroupés : une notification par conversation et par personne', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[awa]');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);
    planned.clear();
    for (const [i, body] of ['Salut !', 'On est 3', 'Prends tes baskets'].entries()) {
      clock = new Date(NOW.getTime() + (i + 1) * 1000);
      await moussa.call('POST', `/conversations/${conversationId}/messages`, {
        clientId: `client-g${i}`,
        body,
      });
    }
    const jobs = [...planned.values()].filter((j) => j.name === 'message-push');
    expect(jobs).toHaveLength(1);
    await runAll('message-push');
    expect(sent).toEqual([
      expect.objectContaining({
        title: 'Foot à la plage',
        body: '3 nouveaux messages',
        data: { type: 'message', conversationId },
        badge: 3,
      }),
    ]);
  });

  it('rien si la conversation a été lue entre-temps', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[awa]');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);
    clock = new Date(NOW.getTime() + 1000);
    await moussa.call('POST', `/conversations/${conversationId}/messages`, {
      clientId: 'client-lu',
      body: 'Salut !',
    });
    clock = new Date(NOW.getTime() + 5000);
    await awa.call('POST', `/conversations/${conversationId}/read`);
    await runAll('message-push');
    expect(sent).toHaveLength(0);
  });

  it('un jeton refusé par Expo est supprimé', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[ancien]');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);
    clock = new Date(NOW.getTime() + 1000);
    await moussa.call('POST', `/conversations/${conversationId}/messages`, {
      clientId: 'client-mort',
      body: 'Hello',
    });
    deadTokens = ['ExponentPushToken[ancien]'];
    await runAll('message-push');
    expect(await t.db.select().from(pushTokens)).toHaveLength(0);
  });
});

describe('jetons et nettoyage', () => {
  it('un téléphone suit le dernier compte connecté', async () => {
    const awa = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[tel]');
    const fatou = await withPhone(await createMember(t, 'Fatou'), 'ExponentPushToken[tel]');
    const rows = await t.db.select().from(pushTokens);
    expect(rows).toEqual([
      expect.objectContaining({ token: 'ExponentPushToken[tel]', userId: fatou.id }),
    ]);
    expect(awa.id).not.toBe(fatou.id);
  });

  it('comptes supprimés depuis 30 jours : effacés pour de bon', async () => {
    const awa = await createMember(t, 'Awa');
    const moussa = await createMember(t, 'Moussa');
    await createActivity(t, awa.id, { startsAt: at(-24 * 40) });
    await awa.call('DELETE', '/me');
    clock = at(24 * 29);
    await processors['purge-deleted-accounts']({});
    expect(await t.db.select().from(users).where(eq(users.id, awa.id))).toHaveLength(1);
    clock = at(24 * 31);
    await processors['purge-deleted-accounts']({});
    expect(await t.db.select().from(users).where(eq(users.id, awa.id))).toHaveLength(0);
    expect(await t.db.select().from(users).where(eq(users.id, moussa.id))).toHaveLength(1);
  });

  it('nettoyage : sessions expirées supprimées', async () => {
    const awa = await createMember(t, 'Awa');
    await t.db.insert(sessions).values({
      id: '01a10000-0000-7000-8000-0000000000aa',
      userId: awa.id,
      familyId: '01a10000-0000-7000-8000-0000000000bb',
      tokenHash: 'x',
      expiresAt: at(-1),
    });
    await processors.cleanup({});
    expect(await t.db.select().from(sessions)).toHaveLength(0);
  });
});

describe('décisions de modération', () => {
  it('la personne est prévenue par push, même si elle a coupé les autres notifications', async () => {
    const awa = await withPhone(await createMember(t, 'Awa'), 'ExponentPushToken[awa]');
    await t.db
      .update(users)
      .set({
        preferences: {
          language: 'fr',
          theme: 'system',
          notifications: { messages: false, activityUpdates: false, reminders: false },
        },
      })
      .where(eq(users.id, awa.id));
    await t.app.events.emit('user.moderated', {
      userId: awa.id,
      status: 'suspended',
      suspendedUntil: new Date('2026-10-10T18:00:00Z'),
    });
    await t.app.events.settled();
    await runAll('moderation-push');
    expect(sent).toMatchObject([
      {
        to: 'ExponentPushToken[awa]',
        title: 'Ton compte est suspendu',
        data: { type: 'moderation' },
      },
    ]);
    expect(sent[0]!.body).toContain('samedi 10 octobre à 18:00');
  });
});
