import {
  startOfDakarDay,
  type ActivityLocation,
  type ActivityCategory,
  type NeighborhoodId,
  type TrustStats,
  type UserStatus,
} from '@lokky/shared';
import type { MockActivity, MockDirect, MockMessage, MockUser } from './db';
import { directConversationId, groupConversationId } from './ids';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const MOCK_VIEWER_ID = 'u_awa';

const trust = (
  activitiesAttended: number,
  attendanceRate: number | null,
  activitiesCreated: number,
  creatorRating: number | null,
  creatorReviewCount: number,
): TrustStats => ({
  activitiesAttended,
  attendanceRate,
  activitiesCreated,
  creatorRating,
  creatorReviewCount,
});

const user = (
  id: string,
  firstName: string,
  status: UserStatus,
  neighborhood: NeighborhoodId,
  interests: ActivityCategory[],
  stats: TrustStats,
  birthDate: string,
): MockUser => ({
  id,
  firstName,
  avatarUrl: null,
  status,
  neighborhood,
  interests,
  trust: stats,
  email: `${id.slice(2)}@exemple.sn`,
  birthDate,
});

const USERS: MockUser[] = [
  user(
    'u_awa',
    'Awa',
    'student',
    'fann',
    ['beach', 'music', 'cinema'],
    trust(4, 1, 1, null, 0),
    '2004-03-12',
  ),
  user(
    'u_moussa',
    'Moussa',
    'newcomer',
    'yoff',
    ['sport', 'beach', 'walk'],
    trust(12, 0.95, 9, 4.8, 21),
    '1999-07-02',
  ),
  user(
    'u_fatou',
    'Fatou',
    'student',
    'point-e',
    ['study', 'culture', 'food'],
    trust(7, 0.86, 3, 4.6, 8),
    '2003-11-25',
  ),
  user(
    'u_ibrahima',
    'Ibrahima',
    'other',
    'ouakam',
    ['sport', 'games', 'music'],
    trust(0, null, 0, null, 0),
    '2001-01-15',
  ),
  user(
    'u_aminata',
    'Aminata',
    'newcomer',
    'almadies',
    ['food', 'walk', 'culture'],
    trust(2, 1, 1, null, 0),
    '1998-05-30',
  ),
  user(
    'u_cheikh',
    'Cheikh',
    'student',
    'medina',
    ['music', 'games', 'sport'],
    trust(20, 0.9, 14, 4.9, 40),
    '2002-09-09',
  ),
  user(
    'u_mariama',
    'Mariama',
    'student',
    'sacre-coeur',
    ['cinema', 'food', 'beach'],
    trust(0, null, 1, null, 0),
    '2005-02-18',
  ),
  user(
    'u_ousmane',
    'Ousmane',
    'newcomer',
    'ngor',
    ['beach', 'walk', 'sport'],
    trust(5, 0.8, 3, 4.2, 5),
    '2000-12-01',
  ),
];

type Place = Omit<ActivityLocation, 'meetingPoint'>;
const PLACES = {
  yoff: { name: 'Plage de Yoff', coordinates: { lat: 14.758, lng: -17.473 }, neighborhood: 'yoff' },
  corniche: {
    name: 'Corniche Ouest',
    coordinates: { lat: 14.693, lng: -17.475 },
    neighborhood: 'fann',
  },
  bu: {
    name: 'Bibliothèque universitaire de l’UCAD',
    coordinates: { lat: 14.6925, lng: -17.4625 },
    neighborhood: 'fann',
  },
  pointE: {
    name: 'Café du Point E',
    coordinates: { lat: 14.696, lng: -17.457 },
    neighborhood: 'point-e',
  },
  mamelles: {
    name: 'Phare des Mamelles',
    coordinates: { lat: 14.724, lng: -17.504 },
    neighborhood: 'ouakam',
  },
  institut: {
    name: 'Institut français de Dakar',
    coordinates: { lat: 14.667, lng: -17.435 },
    neighborhood: 'plateau',
  },
  ngor: {
    name: 'Plage de Ngor',
    coordinates: { lat: 14.7535, lng: -17.516 },
    neighborhood: 'ngor',
  },
  kermel: {
    name: 'Marché Kermel',
    coordinates: { lat: 14.6675, lng: -17.43 },
    neighborhood: 'plateau',
  },
  medina: {
    name: 'Restaurant de la Médina',
    coordinates: { lat: 14.683, lng: -17.45 },
    neighborhood: 'medina',
  },
  goree: {
    name: 'Embarcadère de Gorée',
    coordinates: { lat: 14.673, lng: -17.428 },
    neighborhood: 'plateau',
  },
} satisfies Record<string, Place>;

const at = (place: Place, meetingPoint: string | null = null): ActivityLocation => ({
  ...place,
  meetingPoint,
});

export function buildSeed(now: Date): { users: MockUser[]; activities: MockActivity[] } {
  const today = startOfDakarDay(now).getTime();
  const day = (offset: number, hour: number, minute = 0) =>
    new Date(today + offset * DAY + hour * HOUR + minute * MIN).toISOString();
  const todayAt = (hour: number) => day(0, hour);
  // 0 = aujourd'hui si c'est déjà ce jour-là
  const daysUntil = (weekday: number) => (weekday - now.getUTCDay() + 7) % 7;
  const createdAt = new Date(now.getTime() - 2 * DAY).toISOString();

  const activity = (
    a: Omit<MockActivity, 'cancelledAt' | 'city' | 'createdAt' | 'description'> &
      Partial<Pick<MockActivity, 'cancelledAt' | 'description'>>,
  ): MockActivity => ({ cancelledAt: null, city: 'dakar', createdAt, description: '', ...a });

  const activities: MockActivity[] = [
    activity({
      id: 'a_foot',
      title: 'Foot à la plage',
      category: 'sport',
      startsAt: todayAt(17),
      location: at(PLACES.yoff, 'Devant le poste de secours'),
      capacity: 10,
      cost: { type: 'free' },
      description:
        'Petit match tranquille, tous niveaux. Après, on chill et on fait connaissance !',
      creatorId: 'u_moussa',
      participantIds: ['u_moussa', 'u_ibrahima', 'u_ousmane', 'u_cheikh', 'u_aminata', 'u_fatou'],
    }),
    activity({
      id: 'a_cine',
      title: 'Ciné en plein air',
      category: 'cinema',
      startsAt: todayAt(19),
      location: at(PLACES.corniche),
      capacity: 10,
      cost: { type: 'split', estimateFcfa: 3000 },
      creatorId: 'u_mariama',
      participantIds: ['u_mariama', 'u_aminata', 'u_ibrahima'],
    }),
    activity({
      id: 'a_bu',
      title: 'Révisions de partiels à la BU',
      category: 'study',
      startsAt: day(1, 10),
      location: at(PLACES.bu, 'Entrée principale'),
      capacity: 6,
      cost: { type: 'free' },
      creatorId: 'u_fatou',
      participantIds: ['u_fatou', 'u_awa'],
    }),
    activity({
      id: 'a_jeux',
      title: 'Thé et jeux de société',
      category: 'games',
      startsAt: day(1, 18, 30),
      location: at(PLACES.pointE),
      capacity: 8,
      cost: { type: 'split', estimateFcfa: 1500 },
      creatorId: 'u_cheikh',
      participantIds: ['u_cheikh', 'u_ibrahima', 'u_mariama'],
    }),
    activity({
      id: 'a_kermel',
      title: 'Balade au marché Kermel',
      category: 'culture',
      startsAt: day(2, 10),
      location: at(PLACES.kermel),
      capacity: 8,
      cost: { type: 'free' },
      creatorId: 'u_aminata',
      participantIds: ['u_aminata'],
    }),
    activity({
      id: 'a_mamelles',
      title: 'Coucher de soleil aux Mamelles',
      category: 'walk',
      startsAt: day(daysUntil(6), 17),
      location: at(PLACES.mamelles, 'Parking du phare'),
      capacity: 12,
      cost: { type: 'free' },
      creatorId: 'u_ousmane',
      participantIds: ['u_ousmane', 'u_aminata', 'u_awa', 'u_moussa'],
    }),
    activity({
      id: 'a_concert',
      title: 'Soirée concert live',
      category: 'music',
      startsAt: day(daysUntil(6), 21),
      location: at(PLACES.institut),
      capacity: 6,
      cost: { type: 'split', estimateFcfa: 5000 },
      creatorId: 'u_cheikh',
      participantIds: ['u_cheikh', 'u_fatou', 'u_mariama', 'u_ousmane', 'u_moussa', 'u_aminata'],
    }),
    activity({
      id: 'a_ngor',
      title: 'Baignade à Ngor',
      category: 'beach',
      startsAt: day(daysUntil(0), 11),
      location: at(PLACES.ngor),
      capacity: 15,
      cost: { type: 'free' },
      creatorId: 'u_ousmane',
      participantIds: ['u_ousmane'],
    }),
    activity({
      id: 'a_thieb',
      title: 'Thieb entre potes',
      category: 'food',
      startsAt: day(5, 13),
      location: at(PLACES.medina),
      capacity: 6,
      cost: { type: 'split', estimateFcfa: 2500 },
      creatorId: 'u_awa',
      participantIds: ['u_awa', 'u_fatou'],
    }),
    activity({
      id: 'a_footing',
      title: 'Footing sur la Corniche',
      category: 'sport',
      startsAt: day(-2, 7),
      location: at(PLACES.corniche),
      capacity: 10,
      cost: { type: 'free' },
      creatorId: 'u_moussa',
      participantIds: ['u_moussa', 'u_awa', 'u_ousmane'],
    }),
    activity({
      id: 'a_the',
      title: 'Thé à la Corniche',
      category: 'food',
      startsAt: day(-3, 18),
      location: at(PLACES.corniche, 'Devant la mosquée de la Divinité'),
      capacity: 6,
      cost: { type: 'free' },
      creatorId: 'u_awa',
      participantIds: ['u_awa', 'u_mariama', 'u_ibrahima'],
    }),
    activity({
      id: 'a_goree',
      title: 'Visite de Gorée',
      category: 'culture',
      startsAt: day(2, 9),
      location: at(PLACES.goree),
      capacity: 10,
      cost: { type: 'split', estimateFcfa: 5200 },
      creatorId: 'u_fatou',
      participantIds: ['u_fatou'],
      cancelledAt: new Date(now.getTime() - HOUR).toISOString(),
    }),
  ];

  return { users: USERS, activities };
}

type SeedLine = [minutesAgo: number, senderId: string | null, body: string];

// Discussions déjà commencées dans les groupes. Le spectateur (Awa) a lu certains groupes,
// pas tous : la liste des messages affiche des non-lus dès le démarrage.
const CHATS: Record<string, { lines: SeedLine[]; readUpTo?: number }> = {
  a_foot: {
    lines: [
      [26 * 60, null, 'Moussa a créé la sortie'],
      [25 * 60, 'u_ibrahima', 'Salut ! C’est ma première fois sur Lokky'],
      [24 * 60, 'u_moussa', 'Bienvenue Ibrahima ! Tous niveaux, on joue pour le fun'],
      [3 * 60, 'u_ousmane', 'Quelqu’un a un ballon ?'],
      [2 * 60 + 40, 'u_moussa', 'J’en ramène deux, pas de souci'],
      [90, 'u_aminata', 'Je viens avec des jus de bissap pour la pause'],
    ],
  },
  a_bu: {
    lines: [
      [30 * 60, null, 'Fatou a créé la sortie'],
      [29 * 60, null, 'Awa a rejoint le groupe'],
      [28 * 60, 'u_fatou', 'Hello Awa ! Tu révises quelle matière ?'],
      [27 * 60, 'u_awa', 'Droit constitutionnel, et toi ?'],
      [26 * 60, 'u_fatou', 'Éco. On se met au 1er étage, il y a des prises'],
    ],
    readUpTo: 0,
  },
  a_mamelles: {
    lines: [
      [3 * 24 * 60, null, 'Ousmane a créé la sortie'],
      [2 * 24 * 60, null, 'Aminata a rejoint le groupe'],
      [40 * 60, null, 'Awa a rejoint le groupe'],
      [39 * 60, 'u_ousmane', 'Bienvenue ! On monte jusqu’au phare, prévoyez de bonnes chaussures'],
      [35 * 60, null, 'Moussa a rejoint le groupe'],
      [5 * 60, 'u_aminata', 'Quelqu’un part de Fann ? On peut prendre un taxi ensemble'],
      [4 * 60, 'u_moussa', 'Moi je pars de Yoff, je vous retrouve au parking'],
    ],
    readUpTo: 2,
  },
  a_thieb: {
    lines: [
      [2 * 24 * 60, null, 'Awa a créé la sortie'],
      [47 * 60, null, 'Fatou a rejoint le groupe'],
      [46 * 60, 'u_fatou', 'Le thieb de la Médina, j’attendais ça depuis des semaines'],
    ],
    readUpTo: 0,
  },
  a_the: {
    lines: [
      [5 * 24 * 60, null, 'Awa a créé la sortie'],
      [4 * 24 * 60, null, 'Mariama a rejoint le groupe'],
      [4 * 24 * 60 - 30, null, 'Ibrahima a rejoint le groupe'],
      [2 * 24 * 60 + 10 * 60, 'u_mariama', 'Merci Awa, trop bien ce thé au coucher du soleil'],
    ],
    readUpTo: 0,
  },
  a_footing: {
    lines: [
      [3 * 24 * 60, null, 'Moussa a créé la sortie'],
      [2 * 24 * 60 + 60, 'u_moussa', 'RDV 7h pile devant la mosquée de la Divinité'],
      [2 * 24 * 60 - 4 * 60, 'u_ousmane', 'Merci pour la sortie, à refaire !'],
      [2 * 24 * 60 - 5 * 60, 'u_awa', 'Grave, j’ai adoré'],
    ],
    readUpTo: 0,
  },
};

// Messages privés : Awa et Moussa ont couru ensemble (footing, sortie passée).
const DIRECTS: { userIds: [string, string]; lines: SeedLine[]; readUpTo?: number }[] = [
  {
    userIds: ['u_awa', 'u_moussa'],
    lines: [
      [44 * 60, 'u_moussa', 'Hey Awa ! Tu cours souvent sur la Corniche ?'],
      [43 * 60, 'u_awa', 'Le week-end surtout. Tu refais une sortie bientôt ?'],
      [6 * 60, 'u_moussa', 'Oui, samedi matin ! Je crée la sortie ce soir'],
    ],
    readUpTo: 1,
  },
];

export function buildSeedMessages(now: Date): {
  messages: Map<string, MockMessage[]>;
  readAt: Map<string, string>;
  directs: MockDirect[];
} {
  const messages = new Map<string, MockMessage[]>();
  const readAt = new Map<string, string>();
  const directs: MockDirect[] = [];
  const chats = [
    ...Object.entries(CHATS).map(([activityId, chat]) => ({
      key: activityId,
      conversationId: groupConversationId(activityId),
      ...chat,
    })),
    ...DIRECTS.map((chat) => {
      const conversationId = directConversationId(...chat.userIds);
      const first = chat.lines[0]?.[0] ?? 0;
      directs.push({
        id: conversationId,
        userIds: chat.userIds,
        createdAt: new Date(now.getTime() - first * MIN).toISOString(),
      });
      return { key: conversationId, conversationId, ...chat };
    }),
  ];
  for (const { key, conversationId, lines, readUpTo } of chats) {
    const list = lines.map(([minutesAgo, senderId, body], i) => ({
      id: `m_${key}_${i}`,
      clientId: null,
      conversationId,
      senderId,
      type: senderId ? ('text' as const) : ('system' as const),
      body,
      createdAt: new Date(now.getTime() - minutesAgo * MIN).toISOString(),
    }));
    messages.set(conversationId, list);
    // readUpTo : nombre de messages encore non lus à la fin de la discussion.
    if (readUpTo !== undefined) {
      const lastRead = list[list.length - 1 - readUpTo];
      if (lastRead) readAt.set(conversationId, lastRead.createdAt);
    }
  }
  return { messages, readAt, directs };
}
