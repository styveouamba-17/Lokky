import { ACTIVITY_ONGOING_HOURS, type TrustStats } from '@lokky/shared';
import { and, eq, inArray, isNull, lte, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { activities, participations, reviews } from '../../db/schema';

// Statistiques de confiance (spec app §7.1, `TrustStats`), calculées à partir des données :
// - sorties faites : participations à des sorties terminées, sauf absence déclarée ;
// - taux de présence : parmi les sorties où le créateur a déclaré la présence ;
// - sorties organisées : sorties créées, hors annulées ;
// - note de créateur : moyenne des avis reçus sur ses sorties.

export const EMPTY_TRUST: TrustStats = {
  activitiesAttended: 0,
  attendanceRate: null,
  activitiesCreated: 0,
  creatorRating: null,
  creatorReviewCount: 0,
};

export async function trustFor(
  db: Database,
  userIds: readonly string[],
  now: Date,
): Promise<Map<string, TrustStats>> {
  const ids = [...new Set(userIds)];
  const result = new Map<string, TrustStats>(ids.map((id) => [id, { ...EMPTY_TRUST }]));
  if (ids.length === 0) return result;

  // Une sortie est « faite » quand elle est terminée (début + 3 h), comme getActivityStatus.
  const endedBefore = new Date(now.getTime() - ACTIVITY_ONGOING_HOURS * 3_600_000);

  const attendance = await db
    .select({
      userId: participations.userId,
      attended:
        sql<number>`count(*) filter (where ${participations.attended} is distinct from false)`.mapWith(
          Number,
        ),
      declared: sql<number>`count(*) filter (where ${participations.attended} is not null)`.mapWith(
        Number,
      ),
      present: sql<number>`count(*) filter (where ${participations.attended})`.mapWith(Number),
    })
    .from(participations)
    .innerJoin(activities, eq(activities.id, participations.activityId))
    .where(
      and(
        inArray(participations.userId, ids),
        isNull(activities.cancelledAt),
        lte(activities.startsAt, endedBefore),
      ),
    )
    .groupBy(participations.userId);

  for (const row of attendance) {
    const stats = result.get(row.userId);
    if (!stats) continue;
    stats.activitiesAttended = row.attended;
    stats.attendanceRate =
      row.declared > 0 ? Math.round((row.present / row.declared) * 100) / 100 : null;
  }

  const created = await db
    .select({
      userId: activities.creatorId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(activities)
    .where(and(inArray(activities.creatorId, ids), isNull(activities.cancelledAt)))
    .groupBy(activities.creatorId);

  for (const row of created) {
    const stats = result.get(row.userId);
    if (stats) stats.activitiesCreated = row.count;
  }

  for (const row of await ratings(db, ids)) {
    const stats = result.get(row.userId);
    if (!stats) continue;
    stats.creatorRating = Math.round(row.average * 10) / 10;
    stats.creatorReviewCount = row.count;
  }

  return result;
}

// Note de créateur : moyenne des avis laissés sur ses sorties.
async function ratings(db: Database, ids: string[]) {
  return db
    .select({
      userId: activities.creatorId,
      average: sql<number>`avg(${reviews.rating})`.mapWith(Number),
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(reviews)
    .innerJoin(activities, eq(activities.id, reviews.activityId))
    .where(inArray(activities.creatorId, ids))
    .groupBy(activities.creatorId);
}

// « Première fois ? » : par sortie, les participants (hors spectateur) qui n'ont encore fait
// aucune sortie terminée. Une seule requête pour toute la liste.
export async function firstTimersFor(
  db: Database,
  activityIds: readonly string[],
  viewerId: string,
  now: Date,
): Promise<Map<string, number>> {
  if (activityIds.length === 0) return new Map();
  const endedBefore = new Date(now.getTime() - ACTIVITY_ONGOING_HOURS * 3_600_000).toISOString();
  const rows = await db
    .select({
      activityId: participations.activityId,
      n: sql<number>`count(*)`.mapWith(Number),
    })
    .from(participations)
    .where(
      and(
        inArray(participations.activityId, [...activityIds]),
        sql`${participations.userId} <> ${viewerId}::uuid`,
        sql`not exists (
          select 1 from ${participations} past
          join ${activities} a on a.id = past.activity_id
          where past.user_id = ${participations.userId}
            and a.cancelled_at is null
            and a.starts_at <= ${endedBefore}::timestamptz
            and past.attended is distinct from false
        )`,
      ),
    )
    .groupBy(participations.activityId);
  return new Map(rows.map((r) => [r.activityId, r.n]));
}

// Avis déjà laissés par le spectateur, pour masquer « Laisser un avis ».
export async function reviewedBy(
  db: Database,
  viewerId: string,
  activityIds: readonly string[],
): Promise<Set<string>> {
  if (activityIds.length === 0) return new Set();
  const rows = await db
    .select({ activityId: reviews.activityId })
    .from(reviews)
    .where(and(eq(reviews.authorId, viewerId), inArray(reviews.activityId, [...activityIds])));
  return new Set(rows.map((r) => r.activityId));
}

export async function trustOf(db: Database, userId: string, now: Date): Promise<TrustStats> {
  return (await trustFor(db, [userId], now)).get(userId) ?? { ...EMPTY_TRUST };
}
