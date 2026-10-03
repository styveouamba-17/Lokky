import type { ActivityCategory, ActivityCost, ActivityLocation, City, User } from '@lokky/shared';
import { buildSeed } from './seed';

export type MockUser = User & { email: string; birthDate: string };

export interface MockActivity {
  id: string;
  title: string;
  category: ActivityCategory;
  description: string;
  startsAt: string;
  location: ActivityLocation;
  capacity: number;
  cost: ActivityCost;
  creatorId: string;
  participantIds: string[]; // le créateur en fait partie
  cancelledAt: string | null;
  city: City;
  createdAt: string;
}

export interface MockDb {
  users: Map<string, MockUser>;
  activities: Map<string, MockActivity>;
  // Le compte connecté est toujours le spectateur simulé (MOCK_VIEWER_ID). Tant que
  // l'onboarding n'est pas fait, GET /me répond onboarding_required.
  viewerOnboarded: boolean;
}

export function createMockDb(now: Date, { viewerOnboarded = false } = {}): MockDb {
  const { users, activities } = buildSeed(now);
  return {
    users: new Map(users.map((u) => [u.id, u])),
    activities: new Map(activities.map((a) => [a.id, a])),
    viewerOnboarded,
  };
}
