import { getActivityStatus, type TrustStats } from '@lokky/shared';
import { ApiError } from '../errors';
import type { MockActivity, MockDb, MockUser } from './db';
import type { MockHandlers } from './mockClient';

// Avis et présence (spec §6.3, règle 2 ; §7.1) : ils nourrissent les statistiques de confiance.

function pastActivity(db: MockDb, id: string, now: Date): MockActivity {
  const activity = db.activities.get(id);
  if (!activity) throw new ApiError('not_found', 'Activité introuvable.', 404);
  const status = getActivityStatus(
    new Date(activity.startsAt),
    activity.cancelledAt ? new Date(activity.cancelledAt) : null,
    now,
  );
  if (status !== 'past') throw new ApiError('conflict', 'La sortie n’est pas terminée.', 409);
  return activity;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function withRating(trust: TrustStats, rating: number): TrustStats {
  const count = trust.creatorReviewCount + 1;
  const total = (trust.creatorRating ?? 0) * trust.creatorReviewCount + rating;
  return { ...trust, creatorRating: round1(total / count), creatorReviewCount: count };
}

// Le taux de présence porte sur les sorties où la présence a été déclarée. Le client simulé ne
// garde pas ce nombre : il le déduit du taux et du nombre de sorties faites.
export function withAttendance(trust: TrustStats, attended: boolean): TrustStats {
  const declared =
    trust.attendanceRate && trust.attendanceRate > 0
      ? Math.round(trust.activitiesAttended / trust.attendanceRate)
      : trust.activitiesAttended;
  const activitiesAttended = trust.activitiesAttended + (attended ? 1 : 0);
  return {
    ...trust,
    activitiesAttended,
    attendanceRate: Math.round((activitiesAttended / (declared + 1)) * 100) / 100,
  };
}

function updateTrust(db: MockDb, userId: string, change: (trust: TrustStats) => TrustStats) {
  const user = db.users.get(userId);
  if (user) db.users.set(userId, { ...user, trust: change(user.trust) } satisfies MockUser);
}

export const trustHandlers: MockHandlers = {
  'reviews.create': ({ activityId, creatorRating }, { db, now, viewerId }) => {
    const activity = pastActivity(db, activityId, now());
    if (!activity.participantIds.includes(viewerId)) {
      throw new ApiError('not_participant', 'Tu n’as pas participé à cette sortie.', 403);
    }
    if (activity.creatorId === viewerId) {
      throw new ApiError('forbidden', 'On ne note pas sa propre sortie.', 403);
    }
    const reviewers = db.reviewedBy.get(activityId) ?? new Set<string>();
    if (reviewers.has(viewerId)) throw new ApiError('conflict', 'Avis déjà laissé.', 409);
    reviewers.add(viewerId);
    db.reviewedBy.set(activityId, reviewers);
    updateTrust(db, activity.creatorId, (trust) => withRating(trust, creatorRating));
    return { ok: true };
  },

  'activities.attendance': ({ activityId, attendance }, { db, now, viewerId }) => {
    const activity = pastActivity(db, activityId, now());
    if (activity.creatorId !== viewerId) {
      throw new ApiError('forbidden', 'Seul le créateur indique qui est venu.', 403);
    }
    if (db.attendanceDeclared.has(activityId)) {
      throw new ApiError('conflict', 'Présence déjà indiquée.', 409);
    }
    if (
      attendance.some((a) => a.userId === viewerId || !activity.participantIds.includes(a.userId))
    ) {
      throw new ApiError('validation', 'Participant inconnu.', 400);
    }
    db.attendanceDeclared.add(activityId);
    for (const { userId, attended } of attendance) {
      updateTrust(db, userId, (trust) => withAttendance(trust, attended));
    }
    return { ok: true };
  },
};
