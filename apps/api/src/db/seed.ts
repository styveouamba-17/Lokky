import {
  startOfDakarDay,
  type ActivityCategory,
  type NeighborhoodId,
  type UserStatus,
} from '@lokky/shared';
import { inArray, like } from 'drizzle-orm';
import { fileURLToPath } from 'node:url';
import { uuidv7 } from '../lib/ids';
import { createGroup } from '../modules/chat/groups';
import { createDatabase, type Database } from './client';
import { activities, conversationMembers, messages, participations, users } from './schema';

// Données de démo (spec backend §4) : les mêmes personnes et sorties que le serveur simulé de
// l'app, à des dates proches d'aujourd'hui. Relancer le script remplace la démo précédente,
// sans toucher aux vrais comptes. Jamais en production.

const DEMO_DOMAIN = '@demo.lokky';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const PEOPLE: [
  key: string,
  firstName: string,
  status: UserStatus,
  hood: NeighborhoodId,
  likes: ActivityCategory[],
][] = [
  ['moussa', 'Moussa', 'newcomer', 'yoff', ['sport', 'beach', 'walk']],
  ['fatou', 'Fatou', 'student', 'point-e', ['study', 'culture', 'food']],
  ['ibrahima', 'Ibrahima', 'other', 'ouakam', ['sport', 'games', 'music']],
  ['aminata', 'Aminata', 'newcomer', 'almadies', ['food', 'walk', 'culture']],
  ['cheikh', 'Cheikh', 'student', 'medina', ['music', 'games', 'sport']],
  ['mariama', 'Mariama', 'student', 'sacre-coeur', ['cinema', 'food', 'beach']],
  ['ousmane', 'Ousmane', 'newcomer', 'ngor', ['beach', 'walk', 'sport']],
];

const PLACES = {
  yoff: { name: 'Plage de Yoff', lat: 14.758, lng: -17.473, hood: 'yoff' },
  corniche: { name: 'Corniche Ouest', lat: 14.693, lng: -17.475, hood: 'fann' },
  bu: { name: 'Bibliothèque universitaire de l’UCAD', lat: 14.6925, lng: -17.4625, hood: 'fann' },
  pointE: { name: 'Café du Point E', lat: 14.696, lng: -17.457, hood: 'point-e' },
  mamelles: { name: 'Phare des Mamelles', lat: 14.724, lng: -17.504, hood: 'ouakam' },
  institut: { name: 'Institut français de Dakar', lat: 14.667, lng: -17.435, hood: 'plateau' },
  ngor: { name: 'Plage de Ngor', lat: 14.7535, lng: -17.516, hood: 'ngor' },
  kermel: { name: 'Marché Kermel', lat: 14.6675, lng: -17.43, hood: 'plateau' },
} as const satisfies Record<
  string,
  { name: string; lat: number; lng: number; hood: NeighborhoodId }
>;

interface DemoActivity {
  title: string;
  category: ActivityCategory;
  day: number; // jours à partir d'aujourd'hui (négatif : passé)
  hour: number;
  place: keyof typeof PLACES;
  meetingPoint?: string;
  capacity: number;
  estimate?: number; // FCFA : « chacun paie sa part »
  creator: string;
  with: string[];
  description?: string;
}

const ACTIVITIES: DemoActivity[] = [
  {
    title: 'Foot à la plage',
    category: 'sport',
    day: 0,
    hour: 18,
    place: 'yoff',
    meetingPoint: 'Devant le poste de secours',
    capacity: 10,
    creator: 'moussa',
    with: ['ibrahima', 'ousmane', 'cheikh', 'aminata'],
    description: 'Petit match tranquille, tous niveaux. Après, on chill et on fait connaissance !',
  },
  {
    title: 'Ciné en plein air',
    category: 'cinema',
    day: 0,
    hour: 20,
    place: 'corniche',
    capacity: 10,
    estimate: 3000,
    creator: 'mariama',
    with: ['aminata', 'ibrahima'],
  },
  {
    title: 'Révisions de partiels à la BU',
    category: 'study',
    day: 1,
    hour: 10,
    place: 'bu',
    meetingPoint: 'Entrée principale',
    capacity: 6,
    creator: 'fatou',
    with: [],
  },
  {
    title: 'Thé et jeux de société',
    category: 'games',
    day: 1,
    hour: 18,
    place: 'pointE',
    capacity: 8,
    estimate: 1500,
    creator: 'cheikh',
    with: ['ibrahima', 'mariama'],
  },
  {
    title: 'Balade au marché Kermel',
    category: 'culture',
    day: 2,
    hour: 10,
    place: 'kermel',
    capacity: 8,
    creator: 'aminata',
    with: [],
  },
  {
    title: 'Coucher de soleil aux Mamelles',
    category: 'walk',
    day: 3,
    hour: 17,
    place: 'mamelles',
    meetingPoint: 'Parking du phare',
    capacity: 12,
    creator: 'ousmane',
    with: ['aminata', 'moussa'],
  },
  {
    title: 'Soirée concert live',
    category: 'music',
    day: 3,
    hour: 21,
    place: 'institut',
    capacity: 6,
    estimate: 5000,
    creator: 'cheikh',
    with: ['fatou', 'mariama', 'ousmane', 'moussa'],
  },
  {
    title: 'Baignade à Ngor',
    category: 'beach',
    day: 4,
    hour: 11,
    place: 'ngor',
    capacity: 15,
    creator: 'ousmane',
    with: [],
  },
  {
    title: 'Footing sur la Corniche',
    category: 'sport',
    day: -2,
    hour: 7,
    place: 'corniche',
    capacity: 10,
    creator: 'moussa',
    with: ['ousmane'],
  },
];

// Retire toute la démo : ses personnes, leurs sorties (avec groupes et messages) et leurs
// messages dans les sorties des vrais comptes. Les vrais comptes ne sont pas touchés.
export async function clearDemo(db: Database): Promise<number> {
  const demo = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, `%${DEMO_DOMAIN}`));
  const ids = demo.map((u) => u.id);
  if (ids.length === 0) return 0;
  await db.transaction(async (tx) => {
    await tx.delete(messages).where(inArray(messages.senderId, ids));
    await tx.delete(activities).where(inArray(activities.creatorId, ids));
    await tx.delete(users).where(inArray(users.id, ids));
  });
  return ids.length;
}

export async function seedDemo(db: Database, now: Date = new Date()) {
  // Remplace la démo précédente.
  await clearDemo(db);

  const ids = new Map<string, string>();
  for (const [key, firstName, status, neighborhood, interests] of PEOPLE) {
    const id = uuidv7(now.getTime());
    ids.set(key, id);
    await db.insert(users).values({
      id,
      email: `${key}${DEMO_DOMAIN}`,
      firstName,
      birthDate: '2001-06-15',
      status,
      neighborhood,
      interests,
      onboardedAt: now,
      createdAt: now,
    });
  }

  const today = startOfDakarDay(now).getTime();
  for (const a of ACTIVITIES) {
    const place = PLACES[a.place];
    const creatorId = ids.get(a.creator)!;
    // Une sortie « du jour » déjà passée est décalée au lendemain : la démo reste à venir.
    let startsAt = new Date(today + a.day * DAY + a.hour * HOUR);
    if (a.day >= 0 && startsAt <= now) startsAt = new Date(startsAt.getTime() + DAY);
    const id = uuidv7(now.getTime());
    await db.insert(activities).values({
      id,
      title: a.title,
      category: a.category,
      description: a.description ?? '',
      startsAt,
      placeName: place.name,
      lat: place.lat,
      lng: place.lng,
      neighborhood: place.hood,
      meetingPoint: a.meetingPoint ?? null,
      capacity: a.capacity,
      costType: a.estimate ? 'split' : 'free',
      costEstimateFcfa: a.estimate ?? null,
      creatorId,
      createdAt: new Date(now.getTime() - 2 * DAY),
    });
    const people = [creatorId, ...a.with.map((k) => ids.get(k)!)];
    await db.insert(participations).values(people.map((userId) => ({ activityId: id, userId })));
    const groupId = await createGroup(db, id, creatorId, now);
    const others = people.filter((p) => p !== creatorId);
    if (others.length) {
      await db
        .insert(conversationMembers)
        .values(others.map((userId) => ({ conversationId: groupId, userId, lastReadAt: now })));
    }
  }
  return { people: PEOPLE.length, activities: ACTIVITIES.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL manquante.');
  if (process.env.NODE_ENV === 'production') throw new Error('Pas de démo en production.');
  const database = createDatabase(url, { max: 1 });
  // npm run db:seed -- --clear : retire la démo sans la recréer.
  if (process.argv.includes('--clear')) {
    const removed = await clearDemo(database.db);
    console.log(`Démo retirée : ${removed} personnes et leurs sorties.`);
  } else {
    const result = await seedDemo(database.db);
    console.log(`Démo : ${result.people} personnes, ${result.activities} sorties.`);
  }
  await database.close();
}
