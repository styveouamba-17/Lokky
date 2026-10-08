import { getActivityStatus } from '@lokky/shared';
import type {
  AdminActivityRow,
  AdminMessage,
  AdminReport,
  AdminUserRow,
  ModerationEvent,
  ReportTarget,
} from '@lokky/shared/admin';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import {
  activities,
  adminAudit,
  conversations,
  messages,
  moderationEvents,
  participations,
  reports,
  users,
} from '../db/schema';
import { uuidv7 } from '../lib/ids';
import { findUsers, toUserPreview, type UserRow } from '../modules/users/users';

// Transforme les lignes de la base en objets du contrat de l'admin, par lots : une poignée
// de requêtes pour toute une page, jamais une requête par ligne.

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Nombre de signalements ouverts dont ce compte est le sujet (sous-requête SQL).
// Écrit avec des noms qualifiés : dans une sous-requête, drizzle n'en préfixe pas toujours.
export const openReportsOfUser = sql<number>`(
  select count(*) from reports r
  where r.subject_user_id = "users"."id" and r.status = 'open'
)`.mapWith(Number);

export function toAdminUserRow(row: UserRow, openReports: number): AdminUserRow {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    avatarUrl: row.avatarUrl,
    moderation: { status: row.moderationStatus, suspendedUntil: iso(row.suspendedUntil) },
    role: row.staffRole,
    createdAt: row.createdAt.toISOString(),
    onboardedAt: iso(row.onboardedAt),
    deletedAt: iso(row.deletedAt),
    openReports,
  };
}

export async function adminUserRow(db: Database, id: string): Promise<AdminUserRow | null> {
  const [row] = await db
    .select({ user: users, openReports: openReportsOfUser })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ? toAdminUserRow(row.user, row.openReports) : null;
}

export async function moderationHistory(db: Database, userId: string): Promise<ModerationEvent[]> {
  const rows = await db
    .select()
    .from(moderationEvents)
    .where(eq(moderationEvents.userId, userId))
    .orderBy(desc(moderationEvents.createdAt))
    .limit(50);
  const actors = await findUsers(
    db,
    rows.flatMap((r) => (r.actorId ? [r.actorId] : [])),
  );
  return rows.map((r) => {
    const actor = r.actorId ? actors.get(r.actorId) : undefined;
    return {
      id: r.id,
      status: r.status,
      until: iso(r.until),
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      actor: actor ? { id: actor.id, firstName: actor.firstName } : null,
    };
  });
}

type ActivityRow = typeof activities.$inferSelect;

export async function toAdminActivityRows(
  db: Database,
  rows: ActivityRow[],
  now: Date,
): Promise<AdminActivityRow[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [counts, creators, openReports] = await Promise.all([
    db
      .select({ id: participations.activityId, n: count() })
      .from(participations)
      .where(inArray(participations.activityId, ids))
      .groupBy(participations.activityId),
    findUsers(
      db,
      rows.map((r) => r.creatorId),
    ),
    db
      .select({ id: reports.targetId, n: count() })
      .from(reports)
      .where(
        and(
          eq(reports.targetType, 'activity'),
          eq(reports.status, 'open'),
          inArray(reports.targetId, ids),
        ),
      )
      .groupBy(reports.targetId),
  ]);
  const participantsOf = new Map(counts.map((c) => [c.id, c.n]));
  const reportsOf = new Map(openReports.map((c) => [c.id, c.n]));
  return rows.map((r) => {
    const creator = creators.get(r.creatorId);
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      startsAt: r.startsAt.toISOString(),
      placeName: r.placeName,
      neighborhood: r.neighborhood,
      capacity: r.capacity,
      participantCount: participantsOf.get(r.id) ?? 0,
      creator: creator
        ? toUserPreview(creator)
        : { id: r.creatorId, firstName: 'Membre Lokky', avatarUrl: null },
      status: getActivityStatus(r.startsAt, r.cancelledAt, now),
      cancelledAt: iso(r.cancelledAt),
      createdAt: r.createdAt.toISOString(),
      openReports: reportsOf.get(r.id) ?? 0,
    };
  });
}

type ReportRow = typeof reports.$inferSelect;

export async function toAdminReports(db: Database, rows: ReportRow[]): Promise<AdminReport[]> {
  if (rows.length === 0) return [];
  const idsOf = (type: ReportRow['targetType']) =>
    rows.filter((r) => r.targetType === type && UUID.test(r.targetId)).map((r) => r.targetId);
  const messageIds = idsOf('message');
  const activityIds = idsOf('activity');

  const [messageRows, activityRows, openCounts] = await Promise.all([
    messageIds.length
      ? db
          .select({
            message: messages,
            conversationType: conversations.type,
            activityId: activities.id,
            activityTitle: activities.title,
          })
          .from(messages)
          .innerJoin(conversations, eq(conversations.id, messages.conversationId))
          .leftJoin(activities, eq(activities.id, conversations.activityId))
          .where(inArray(messages.id, messageIds))
      : [],
    activityIds.length
      ? db.select().from(activities).where(inArray(activities.id, activityIds))
      : [],
    db
      .select({ type: reports.targetType, id: reports.targetId, n: count() })
      .from(reports)
      .where(
        and(
          eq(reports.status, 'open'),
          inArray(
            reports.targetId,
            rows.map((r) => r.targetId),
          ),
        ),
      )
      .groupBy(reports.targetType, reports.targetId),
  ]);

  const people = await findUsers(
    db,
    [
      ...rows.flatMap((r) => [r.reporterId, r.handledBy]),
      ...idsOf('user'),
      ...messageRows.map((m) => m.message.senderId),
      ...activityRows.map((a) => a.creatorId),
    ].filter((id): id is string => Boolean(id)),
  );

  const messagesById = new Map(messageRows.map((m) => [m.message.id, m]));
  const activitiesById = new Map(activityRows.map((a) => [a.id, a]));
  const openOf = new Map(openCounts.map((c) => [`${c.type}:${c.id}`, c.n]));
  const preview = (id: string | null) => {
    const row = id ? people.get(id) : undefined;
    return row ? toUserPreview(row) : null;
  };

  const targetOf = (r: ReportRow): ReportTarget => {
    if (r.targetType === 'user') {
      const user = people.get(r.targetId);
      return {
        type: 'user',
        id: r.targetId,
        user: user
          ? {
              id: user.id,
              firstName: user.firstName,
              avatarUrl: user.avatarUrl,
              moderation: {
                status: user.moderationStatus,
                suspendedUntil: iso(user.suspendedUntil),
              },
            }
          : null,
      };
    }
    if (r.targetType === 'message') {
      const found = messagesById.get(r.targetId);
      return {
        type: 'message',
        id: r.targetId,
        message: found
          ? {
              id: found.message.id,
              body: found.message.body,
              createdAt: found.message.createdAt.toISOString(),
              sender: preview(found.message.senderId),
              conversationId: found.message.conversationId,
              conversationType: found.conversationType,
              activity:
                found.activityId && found.activityTitle
                  ? { id: found.activityId, title: found.activityTitle }
                  : null,
            }
          : null,
      };
    }
    const activity = activitiesById.get(r.targetId);
    return {
      type: 'activity',
      id: r.targetId,
      activity: activity
        ? {
            id: activity.id,
            title: activity.title,
            startsAt: activity.startsAt.toISOString(),
            cancelledAt: iso(activity.cancelledAt),
            creator: preview(activity.creatorId) ?? {
              id: activity.creatorId,
              firstName: 'Membre Lokky',
              avatarUrl: null,
            },
          }
        : null,
    };
  };

  return rows.map((r) => {
    const handler = r.handledBy ? people.get(r.handledBy) : undefined;
    return {
      id: r.id,
      reason: r.reason as AdminReport['reason'],
      details: r.details,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reporter: preview(r.reporterId),
      target: targetOf(r),
      handledAt: iso(r.handledAt),
      handledBy: handler ? { id: handler.id, firstName: handler.firstName } : null,
      note: r.note,
      sameTargetOpen: openOf.get(`${r.targetType}:${r.targetId}`) ?? 0,
    };
  });
}

type MessageRow = typeof messages.$inferSelect;

export async function toAdminMessages(db: Database, rows: MessageRow[]): Promise<AdminMessage[]> {
  const senders = await findUsers(
    db,
    rows.flatMap((r) => (r.senderId ? [r.senderId] : [])),
  );
  return rows.map((r) => {
    const sender = r.senderId ? senders.get(r.senderId) : undefined;
    return {
      id: r.id,
      sender: sender ? toUserPreview(sender) : null,
      type: r.type,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

// Journal de l'équipe (décisions, lectures de conversations).
export async function audit(
  db: Database,
  entry: {
    actorId: string;
    action: string;
    targetType: string;
    targetId: string;
    details?: Record<string, unknown>;
    now: Date;
  },
) {
  await db.insert(adminAudit).values({
    id: uuidv7(entry.now.getTime()),
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details ?? null,
    createdAt: entry.now,
  });
}

// Recherche « contient », insensible à la casse : les jokers tapés sont pris à la lettre.
export const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export const pageParams = (input: { page?: number; pageSize?: number }, fallback: number) => {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? fallback;
  return { page, pageSize, offset: (page - 1) * pageSize };
};
