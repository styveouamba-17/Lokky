import { getActivityStatus, LIMITS, type Activity } from '@lokky/shared';
import { asc, inArray } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { activities, participations } from '../../db/schema';
import { groupIdsFor } from '../chat/groups';
import { firstTimersFor, reviewedBy, trustFor } from '../trust/stats';
import { findUsers, toUserPreview } from '../users/users';

export type ActivityRow = typeof activities.$inferSelect;

export const statusOf = (row: Pick<ActivityRow, 'startsAt' | 'cancelledAt'>, now: Date) =>
  getActivityStatus(row.startsAt, row.cancelledAt, now);

// Transforme des lignes de la base en `Activity` du contrat, en une poignée de requêtes pour
// toute la liste (participants, créateurs, confiance, groupes) : jamais une requête par sortie.
export async function toActivities(
  db: Database,
  rows: readonly ActivityRow[],
  { viewerId, now, distances }: { viewerId: string; now: Date; distances?: Map<string, number> },
): Promise<Activity[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const members = await db
    .select()
    .from(participations)
    .where(inArray(participations.activityId, ids))
    .orderBy(asc(participations.joinedAt));
  const byActivity = new Map<string, (typeof members)[number][]>();
  for (const m of members)
    byActivity.set(m.activityId, [...(byActivity.get(m.activityId) ?? []), m]);

  // On ne charge que ce qui s'affiche : les créateurs (avec leur confiance) et les 5 premiers
  // participants de chaque sortie. Les « première fois » se comptent en une requête.
  const creatorIds = rows.map((r) => r.creatorId);
  const previewIds = [...byActivity.values()].flatMap((list) =>
    list.slice(0, LIMITS.activity.participantsPreviewMax).map((m) => m.userId),
  );
  const [people, trust, groups, reviewed, firstTimers] = await Promise.all([
    findUsers(db, [...creatorIds, ...previewIds]),
    trustFor(db, creatorIds, now),
    groupIdsFor(db, ids),
    reviewedBy(db, viewerId, ids),
    firstTimersFor(db, ids, viewerId, now),
  ]);

  return rows.map((row) => {
    const list = byActivity.get(row.id) ?? [];
    const creator = people.get(row.creatorId);
    const status = statusOf(row, now);
    const isCreator = row.creatorId === viewerId;
    const isParticipant = list.some((m) => m.userId === viewerId);
    const isFull = list.length >= row.capacity;
    const upcoming = status === 'upcoming';
    // Le créateur a déjà indiqué qui est venu : au moins une présence renseignée.
    const attendanceDeclared = list.some((m) => m.userId !== row.creatorId && m.attended !== null);
    const distance = distances?.get(row.id);

    return {
      id: row.id,
      title: row.title,
      category: row.category,
      description: row.description,
      startsAt: row.startsAt.toISOString(),
      location: {
        name: row.placeName,
        coordinates: { lat: row.lat, lng: row.lng },
        neighborhood: row.neighborhood,
        meetingPoint: row.meetingPoint,
      },
      capacity: row.capacity,
      cost:
        row.costType === 'free'
          ? { type: 'free' as const }
          : row.costEstimateFcfa === null
            ? { type: 'split' as const }
            : { type: 'split' as const, estimateFcfa: row.costEstimateFcfa },
      creator: {
        ...(creator
          ? toUserPreview(creator)
          : { id: row.creatorId, firstName: 'Membre Lokky', avatarUrl: null }),
        trust: trust.get(row.creatorId)!,
      },
      participantCount: list.length,
      participantsPreview: list.slice(0, LIMITS.activity.participantsPreviewMax).flatMap((m) => {
        const person = people.get(m.userId);
        return person ? [toUserPreview(person)] : [];
      }),
      firstTimerCount: firstTimers.get(row.id) ?? 0,
      status,
      city: row.city,
      distanceKm: distance === undefined ? null : Math.round(distance * 10) / 10,
      viewerState: {
        isParticipant,
        isCreator,
        canJoin: upcoming && !isParticipant && !isFull,
        canLeave: upcoming && isParticipant && !isCreator,
        canReview: status === 'past' && isParticipant && !isCreator && !reviewed.has(row.id),
        canDeclareAttendance:
          status === 'past' && isCreator && list.length > 1 && !attendanceDeclared,
        conversationId: isParticipant ? (groups.get(row.id) ?? null) : null,
      },
      createdAt: row.createdAt.toISOString(),
    };
  });
}
