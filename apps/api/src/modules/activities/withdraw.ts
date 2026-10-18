import { and, eq, gt, inArray, isNull, ne } from 'drizzle-orm';
import { activities, participations } from '../../db/schema';
import type { EventBus } from '../../events';
import { removeGroupMember, type Tx } from '../chat/groups';

export interface Withdrawal {
  // Sorties à venir qu'elle organisait : annulées.
  cancelled: string[];
  // Sorties à venir des autres qu'elle avait rejointes : quittées.
  left: string[];
}

// Retire une personne de toutes ses sorties à venir (compte supprimé ou banni) : celles
// qu'elle organise sont annulées, elle quitte celles des autres. Les sorties déjà commencées
// ne changent pas. À appeler dans la transaction de l'action, puis announceWithdrawal.
export async function withdrawFromUpcoming(tx: Tx, userId: string, now: Date): Promise<Withdrawal> {
  const cancelled = await tx
    .update(activities)
    .set({ cancelledAt: now })
    .where(
      and(
        eq(activities.creatorId, userId),
        isNull(activities.cancelledAt),
        gt(activities.startsAt, now),
      ),
    )
    .returning({ id: activities.id });

  const joined = await tx
    .select({ id: participations.activityId })
    .from(participations)
    .innerJoin(activities, eq(activities.id, participations.activityId))
    .where(
      and(
        eq(participations.userId, userId),
        ne(activities.creatorId, userId),
        isNull(activities.cancelledAt),
        gt(activities.startsAt, now),
      ),
    );
  const left = joined.map((j) => j.id);
  if (left.length) {
    await tx
      .delete(participations)
      .where(and(eq(participations.userId, userId), inArray(participations.activityId, left)));
    for (const activityId of left) await removeGroupMember(tx, activityId, userId);
  }
  return { cancelled: cancelled.map((c) => c.id), left };
}

// Après la transaction : participants prévenus (temps réel, push), rappels retirés, message
// « ne vient plus » dans les groupes quittés.
export async function announceWithdrawal(
  events: EventBus,
  userId: string,
  { cancelled, left }: Withdrawal,
  at: Date,
) {
  for (const activityId of cancelled) await events.emit('activity.cancelled', { activityId, at });
  for (const activityId of left) await events.emit('activity.left', { activityId, userId, at });
}
