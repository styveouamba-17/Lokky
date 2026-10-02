import {
  startOfDakarDay,
  type ActivityLocation,
  type ActivityCategory,
  type NeighborhoodId,
  type TrustStats,
  type UserStatus,
} from '@lokky/shared';
import type { MockActivity, MockUser } from './db';

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
