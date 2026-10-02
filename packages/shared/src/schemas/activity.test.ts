import { describe, expect, it } from 'vitest';
import {
  activityCostSchema,
  activityListQuerySchema,
  activitySchema,
  makeCreateActivityInputSchema,
} from './activity';

const NOW = new Date('2026-10-07T10:00:00Z');
const inMinutes = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();
const create = makeCreateActivityInputSchema(() => NOW);

const location = {
  name: 'Plage de Yoff',
  coordinates: { lat: 14.758, lng: -17.473 },
  neighborhood: 'yoff',
  meetingPoint: null,
};
const validCreate = {
  title: 'Foot à la plage',
  category: 'sport',
  startsAt: inMinutes(120),
  location,
  capacity: 10,
  cost: { type: 'free' },
};

function makeActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    title: 'Foot à la plage',
    category: 'sport',
    description: '',
    startsAt: inMinutes(120),
    location,
    capacity: 10,
    cost: { type: 'free' },
    creator: {
      id: 'u1',
      firstName: 'Moussa',
      avatarUrl: null,
      trust: {
        activitiesAttended: 12,
        attendanceRate: 0.95,
        activitiesCreated: 9,
        creatorRating: 4.8,
        creatorReviewCount: 21,
      },
    },
    participantCount: 3,
    participantsPreview: [],
    firstTimerCount: 0,
    status: 'upcoming',
    city: 'dakar',
    distanceKm: null,
    viewerState: {
      isParticipant: false,
      isCreator: false,
      canJoin: true,
      canLeave: false,
      canReview: false,
    },
    createdAt: NOW.toISOString(),
    ...overrides,
  };
}

describe('coût', () => {
  it('accepte « gratuit » et retire les champs en trop', () => {
    expect(activityCostSchema.parse({ type: 'free', estimateFcfa: 3000 })).toEqual({
      type: 'free',
    });
  });
  it('accepte « chacun paie sa part » avec ou sans estimation', () => {
    expect(activityCostSchema.safeParse({ type: 'split' }).success).toBe(true);
    expect(activityCostSchema.safeParse({ type: 'split', estimateFcfa: 3000 }).success).toBe(true);
  });
  it('refuse une estimation négative ou décimale', () => {
    expect(activityCostSchema.safeParse({ type: 'split', estimateFcfa: -5 }).success).toBe(false);
    expect(activityCostSchema.safeParse({ type: 'split', estimateFcfa: 2.5 }).success).toBe(false);
  });
});

describe('création d’activité', () => {
  it('accepte une activité valide et met la description à vide par défaut', () => {
    expect(create.parse(validCreate).description).toBe('');
  });
  it('refuse un début dans moins de 15 minutes', () => {
    expect(create.safeParse({ ...validCreate, startsAt: inMinutes(10) }).success).toBe(false);
  });
  it('refuse un début dans plus de 60 jours', () => {
    expect(create.safeParse({ ...validCreate, startsAt: inMinutes(61 * 24 * 60) }).success).toBe(
      false,
    );
  });
  it('refuse une capacité hors de 2 à 20', () => {
    expect(create.safeParse({ ...validCreate, capacity: 1 }).success).toBe(false);
    expect(create.safeParse({ ...validCreate, capacity: 21 }).success).toBe(false);
  });
});

describe('activité', () => {
  it('accepte une activité complète valide', () => {
    expect(activitySchema.safeParse(makeActivity()).success).toBe(true);
  });
  it('refuse plus de participants que de places', () => {
    expect(activitySchema.safeParse(makeActivity({ participantCount: 11 })).success).toBe(false);
  });
});

describe('filtres de liste', () => {
  it('exige lat et lng ensemble', () => {
    expect(activityListQuerySchema.safeParse({ lat: 14.7 }).success).toBe(false);
    expect(activityListQuerySchema.safeParse({ lat: 14.7, lng: -17.4 }).success).toBe(true);
  });
});
