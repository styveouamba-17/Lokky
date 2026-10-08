import type { ActivityCategory } from '@lokky/shared';
import type { AdminStats } from '@lokky/shared/admin';
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
  type AnyColumn,
} from 'drizzle-orm';
import { activities, messages, participations, reports, users } from '../../db/schema';
import type { AdminHandlers } from '../context';

const DAY_MS = 86_400_000;

// Jour (UTC = heure de Dakar, sans heure d'été) d'une colonne date-heure.
const dayOf = (column: AnyColumn) =>
  sql<string>`to_char(${column} at time zone 'UTC', 'YYYY-MM-DD')`;

export const adminStatsHandlers: AdminHandlers = {
  'admin.stats': async (input, { db, now }) => {
    const n = now();
    const days = input.days ?? 30;
    // Période : les `days` derniers jours, aujourd'hui compris, depuis minuit UTC.
    const today = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
    const start = new Date(today - (days - 1) * DAY_MS);

    const joinedDay = dayOf(participations.joinedAt);
    const [
      [members],
      [newMembers],
      [upcoming],
      [created],
      [joins],
      [messageCount],
      [openReports],
      [suspended],
      [banned],
      signupRows,
      activityRows,
      joinRows,
      reportRows,
      categoryRows,
    ] = await Promise.all([
      db
        .select({ n: count() })
        .from(users)
        .where(and(isNotNull(users.onboardedAt), isNull(users.deletedAt))),
      db.select({ n: count() }).from(users).where(gte(users.onboardedAt, start)),
      db
        .select({ n: count() })
        .from(activities)
        .where(and(isNull(activities.cancelledAt), gt(activities.startsAt, n))),
      db.select({ n: count() }).from(activities).where(gte(activities.createdAt, start)),
      // Le créateur est le premier participant : seules les vraies inscriptions comptent.
      db
        .select({ n: count() })
        .from(participations)
        .innerJoin(activities, eq(activities.id, participations.activityId))
        .where(
          and(gte(participations.joinedAt, start), ne(participations.userId, activities.creatorId)),
        ),
      db
        .select({ n: count() })
        .from(messages)
        .where(and(gte(messages.createdAt, start), eq(messages.type, 'text'))),
      db.select({ n: count() }).from(reports).where(eq(reports.status, 'open')),
      db
        .select({ n: count() })
        .from(users)
        .where(
          and(
            eq(users.moderationStatus, 'suspended'),
            or(isNull(users.suspendedUntil), gt(users.suspendedUntil, n)),
          ),
        ),
      db.select({ n: count() }).from(users).where(eq(users.moderationStatus, 'banned')),
      db
        .select({ day: dayOf(users.onboardedAt), n: count() })
        .from(users)
        .where(gte(users.onboardedAt, start))
        .groupBy(dayOf(users.onboardedAt)),
      db
        .select({ day: dayOf(activities.createdAt), n: count() })
        .from(activities)
        .where(gte(activities.createdAt, start))
        .groupBy(dayOf(activities.createdAt)),
      db
        .select({ day: joinedDay, n: count() })
        .from(participations)
        .innerJoin(activities, eq(activities.id, participations.activityId))
        .where(
          and(gte(participations.joinedAt, start), ne(participations.userId, activities.creatorId)),
        )
        .groupBy(joinedDay),
      db
        .select({ day: dayOf(reports.createdAt), n: count() })
        .from(reports)
        .where(gte(reports.createdAt, start))
        .groupBy(dayOf(reports.createdAt)),
      db
        .select({ category: activities.category, n: count() })
        .from(activities)
        .where(gte(activities.createdAt, start))
        .groupBy(activities.category)
        .orderBy(desc(count())),
    ]);

    const byDay = (rows: { day: string; n: number }[]) => new Map(rows.map((r) => [r.day, r.n]));
    const [signups, createdByDay, joined, reported] = [
      byDay(signupRows),
      byDay(activityRows),
      byDay(joinRows),
      byDay(reportRows),
    ];
    const series: AdminStats['series'] = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start.getTime() + i * DAY_MS).toISOString().slice(0, 10);
      series.push({
        date,
        signups: signups.get(date) ?? 0,
        activities: createdByDay.get(date) ?? 0,
        joins: joined.get(date) ?? 0,
        reports: reported.get(date) ?? 0,
      });
    }

    return {
      days,
      totals: {
        members: members?.n ?? 0,
        newMembers: newMembers?.n ?? 0,
        activitiesUpcoming: upcoming?.n ?? 0,
        activitiesCreated: created?.n ?? 0,
        joins: joins?.n ?? 0,
        messages: messageCount?.n ?? 0,
        openReports: openReports?.n ?? 0,
        suspended: suspended?.n ?? 0,
        banned: banned?.n ?? 0,
      },
      series,
      categories: categoryRows.map((r) => ({
        category: r.category as ActivityCategory,
        count: r.n,
      })),
    };
  },
};
