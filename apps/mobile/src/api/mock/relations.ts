import { getActivityStatus } from '@lokky/shared';
import type { MockDb } from './db';

// Relations entre deux personnes : blocage (spec §6.3, règle 6) et sortie partagée (règle 4).

export const blockKey = (blockerId: string, blockedId: string) => `${blockerId}>${blockedId}`;

export const hasBlocked = (db: MockDb, blockerId: string, blockedId: string) =>
  db.blocks.has(blockKey(blockerId, blockedId));

// Un blocage, dans un sens ou dans l'autre, coupe tout entre les deux personnes.
export const isBlockedEitherWay = (db: MockDb, a: string, b: string) =>
  hasBlocked(db, a, b) || hasBlocked(db, b, a);

// Les deux ont participé à une même sortie, déjà passée.
export function sharedPastActivity(db: MockDb, a: string, b: string, now: Date): boolean {
  return [...db.activities.values()].some(
    (activity) =>
      activity.participantIds.includes(a) &&
      activity.participantIds.includes(b) &&
      getActivityStatus(
        new Date(activity.startsAt),
        activity.cancelledAt ? new Date(activity.cancelledAt) : null,
        now,
      ) === 'past',
  );
}

export const canMessage = (db: MockDb, a: string, b: string, now: Date) =>
  a !== b && !isBlockedEitherWay(db, a, b) && sharedPastActivity(db, a, b, now);
