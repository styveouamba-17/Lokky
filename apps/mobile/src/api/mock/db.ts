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
}

export function createMockDb(now: Date): MockDb {
  const { users, activities } = buildSeed(now);
  return {
    users: new Map(users.map((u) => [u.id, u])),
    activities: new Map(activities.map((a) => [a.id, a])),
  };
}
