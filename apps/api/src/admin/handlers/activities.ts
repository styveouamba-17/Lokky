import { ADMIN_PAGE_SIZE, type AdminActivityDetail } from '@lokky/shared/admin';
import { getActivityStatus } from '@lokky/shared';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  isNotNull,
  isNull,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';
import type { Database } from '../../db/client';
import { activities, messages, participations, reports, users } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { groupIdOf } from '../../modules/chat/groups';
import { toUserPreview } from '../../modules/users/users';
import { staffOf, type AdminHandlers } from '../context';
import {
  audit,
  likePattern,
  pageParams,
  toAdminActivityRows,
  toAdminMessages,
  toAdminReports,
  UUID,
} from '../views';

const MESSAGES_PAGE_SIZE = 50;

export const adminActivityHandlers: AdminHandlers = {
  'admin.activities.list': async (input, { db, now }) => {
    const n = now();
    const { page, pageSize, offset } = pageParams(input, ADMIN_PAGE_SIZE);
    const conditions: (SQL | undefined)[] = [];
    const q = input.q?.trim();
    if (q) {
      conditions.push(
        UUID.test(q)
          ? eq(activities.id, q)
          : or(
              ilike(activities.title, likePattern(q)),
              ilike(activities.placeName, likePattern(q)),
            ),
      );
    }
    const filter = input.filter ?? 'all';
    if (filter === 'upcoming')
      conditions.push(isNull(activities.cancelledAt), gt(activities.startsAt, n));
    if (filter === 'past')
      conditions.push(isNull(activities.cancelledAt), lte(activities.startsAt, n));
    if (filter === 'cancelled') conditions.push(isNotNull(activities.cancelledAt));
    const where = and(...conditions);
    // À venir : la plus proche d'abord. Sinon : les plus récentes d'abord.
    const order =
      filter === 'upcoming'
        ? [asc(activities.startsAt)]
        : filter === 'all'
          ? [desc(activities.createdAt)]
          : [desc(activities.startsAt)];
    const [rows, [{ total } = { total: 0 }]] = await Promise.all([
      db
        .select()
        .from(activities)
        .where(where)
        .orderBy(...order)
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(activities).where(where),
    ]);
    return { items: await toAdminActivityRows(db, rows, n), total, page, pageSize };
  },

  'admin.activities.get': ({ id }, { db, now }) => activityDetail(db, id, now()),

  // Lire le chat d'un groupe est une intrusion : chaque ouverture est journalisée.
  'admin.activities.messages': async (input, ctx) => {
    const staff = staffOf(ctx);
    const { page, pageSize, offset } = pageParams(input, MESSAGES_PAGE_SIZE);
    const conversationId = UUID.test(input.id) ? await groupIdOf(ctx.db, input.id) : null;
    if (!conversationId) throw new HttpError('not_found', 'Discussion introuvable.');
    if (page === 1) {
      await audit(ctx.db, {
        actorId: staff.id,
        action: 'activity.messages.view',
        targetType: 'activity',
        targetId: input.id,
        now: ctx.now(),
      });
    }
    const where = eq(messages.conversationId, conversationId);
    const [rows, [{ total } = { total: 0 }]] = await Promise.all([
      ctx.db
        .select()
        .from(messages)
        .where(where)
        .orderBy(desc(messages.createdAt), desc(messages.id))
        .limit(pageSize)
        .offset(offset),
      ctx.db.select({ total: count() }).from(messages).where(where),
    ]);
    return { items: await toAdminMessages(ctx.db, rows), total, page, pageSize };
  },

  // Annulation par l'équipe : mêmes effets qu'une annulation par le créateur (message
  // système, notification des participants, mise à jour en direct).
  'admin.activities.cancel': async ({ id, reason }, ctx) => {
    const staff = staffOf(ctx);
    const now = ctx.now();
    const [row] = UUID.test(id)
      ? await ctx.db.select().from(activities).where(eq(activities.id, id)).limit(1)
      : [];
    if (!row) throw new HttpError('not_found', 'Sortie introuvable.');
    if (row.cancelledAt) throw new HttpError('conflict', 'Sortie déjà annulée.');
    if (getActivityStatus(row.startsAt, row.cancelledAt, now) !== 'upcoming') {
      throw new HttpError('activity_started', 'La sortie a déjà commencé.');
    }
    await ctx.db.update(activities).set({ cancelledAt: now }).where(eq(activities.id, id));
    await audit(ctx.db, {
      actorId: staff.id,
      action: 'activity.cancel',
      targetType: 'activity',
      targetId: id,
      details: { reason },
      now,
    });
    await ctx.events.emit('activity.cancelled', { activityId: id, at: now });
    return activityDetail(ctx.db, id, now);
  },
};

async function activityDetail(db: Database, id: string, now: Date): Promise<AdminActivityDetail> {
  const [row] = UUID.test(id)
    ? await db.select().from(activities).where(eq(activities.id, id)).limit(1)
    : [];
  if (!row) throw new HttpError('not_found', 'Sortie introuvable.');

  const conversationId = await groupIdOf(db, id);
  const [[base], people, reportRows, [{ n: messageCount } = { n: 0 }]] = await Promise.all([
    toAdminActivityRows(db, [row], now),
    db
      .select({ user: users, joinedAt: participations.joinedAt, attended: participations.attended })
      .from(participations)
      .innerJoin(users, eq(users.id, participations.userId))
      .where(eq(participations.activityId, id))
      .orderBy(asc(participations.joinedAt)),
    db
      .select()
      .from(reports)
      .where(and(eq(reports.targetType, 'activity'), eq(reports.targetId, id)))
      .orderBy(desc(reports.createdAt)),
    conversationId
      ? db
          .select({ n: count() })
          .from(messages)
          .where(and(eq(messages.conversationId, conversationId), eq(messages.type, 'text')))
      : [{ n: 0 }],
  ]);

  return {
    ...base!,
    description: row.description,
    meetingPoint: row.meetingPoint,
    costType: row.costType,
    costEstimateFcfa: row.costEstimateFcfa,
    lat: row.lat,
    lng: row.lng,
    conversationId,
    messageCount,
    participants: people.map((p) => ({
      ...toUserPreview(p.user),
      joinedAt: p.joinedAt.toISOString(),
      attended: p.attended,
      isCreator: p.user.id === row.creatorId,
    })),
    reports: await toAdminReports(db, reportRows),
  };
}
