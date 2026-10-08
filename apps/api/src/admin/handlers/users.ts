import { ADMIN_PAGE_SIZE, type AdminUserDetail, type Staff } from '@lokky/shared/admin';
import { and, count, desc, eq, ilike, isNotNull, isNull, or, type SQL } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { activities, authIdentities, participations, reports, users } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { trustOf } from '../../modules/trust/stats';
import { applyModeration } from '../../modules/users/moderation';
import { findUser } from '../../modules/users/users';
import { staffOf, type AdminHandlers } from '../context';
import {
  audit,
  likePattern,
  moderationHistory,
  openReportsOfUser,
  pageParams,
  toAdminActivityRows,
  toAdminReports,
  toAdminUserRow,
  UUID,
} from '../views';

const DAY_MS = 86_400_000;

export const adminUserHandlers: AdminHandlers = {
  'admin.users.list': async (input, { db }) => {
    const { page, pageSize, offset } = pageParams(input, ADMIN_PAGE_SIZE);
    const conditions: (SQL | undefined)[] = [];
    const q = input.q?.trim();
    if (q) {
      conditions.push(
        UUID.test(q)
          ? eq(users.id, q)
          : or(ilike(users.email, likePattern(q)), ilike(users.firstName, likePattern(q))),
      );
    }
    const filter = input.filter ?? 'all';
    if (filter === 'deleted') conditions.push(isNotNull(users.deletedAt));
    else if (filter !== 'all') {
      conditions.push(eq(users.moderationStatus, filter), isNull(users.deletedAt));
    }
    const where = and(...conditions);
    const [rows, [{ total } = { total: 0 }]] = await Promise.all([
      db
        .select({ user: users, openReports: openReportsOfUser })
        .from(users)
        .where(where)
        // Les comptes les plus signalés d'abord, puis les plus récents.
        .orderBy(desc(openReportsOfUser), desc(users.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(users).where(where),
    ]);
    return {
      items: rows.map((r) => toAdminUserRow(r.user, r.openReports)),
      total,
      page,
      pageSize,
    };
  },

  'admin.users.get': ({ id }, { db, now }) => userDetail(db, id, now()),

  'admin.users.moderate': async ({ id, status, days, reason }, ctx) => {
    const staff = staffOf(ctx);
    const now = ctx.now();
    const target = UUID.test(id) ? await findUser(ctx.db, id) : null;
    if (!target || target.deletedAt) throw new HttpError('not_found', 'Compte introuvable.');
    assertCanModerate(staff, target, status);

    const until = status === 'suspended' && days ? new Date(now.getTime() + days * DAY_MS) : null;
    const notice = await applyModeration(ctx.db, {
      userId: id,
      status,
      until,
      reason,
      actorId: staff.id,
      now,
    });
    await audit(ctx.db, {
      actorId: staff.id,
      action: `user.${status}`,
      targetType: 'user',
      targetId: id,
      details: { reason, days: days ?? null },
      now,
    });
    await ctx.publishModeration(notice);
    await ctx.events.emit('user.moderated', { userId: id, status, suspendedUntil: until });
    return userDetail(ctx.db, id, now);
  },
};

// Règles de l'équipe : on ne se modère pas soi-même ; bannir, lever un bannissement et
// modérer un autre membre de l'équipe sont réservés aux administrateurs.
function assertCanModerate(
  staff: Staff,
  target: { id: string; staffRole: string | null; moderationStatus: string },
  status: string,
) {
  if (target.id === staff.id)
    throw new HttpError('forbidden', 'Impossible de te modérer toi-même.');
  if (staff.role === 'admin') return;
  if (target.staffRole) throw new HttpError('forbidden', 'Réservé aux administrateurs.');
  if (status === 'banned' || target.moderationStatus === 'banned') {
    throw new HttpError(
      'forbidden',
      'Bannir ou lever un bannissement : réservé aux administrateurs.',
    );
  }
}

export async function userDetail(db: Database, id: string, now: Date): Promise<AdminUserDetail> {
  if (!UUID.test(id)) throw new HttpError('not_found', 'Compte introuvable.');
  const [row] = await db
    .select({ user: users, openReports: openReportsOfUser })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!row) throw new HttpError('not_found', 'Compte introuvable.');

  const [identities, trust, history, receivedRows, [{ made } = { made: 0 }], activityRows] =
    await Promise.all([
      db
        .select({ provider: authIdentities.provider })
        .from(authIdentities)
        .where(eq(authIdentities.userId, id)),
      trustOf(db, id, now),
      moderationHistory(db, id),
      db
        .select()
        .from(reports)
        .where(eq(reports.subjectUserId, id))
        .orderBy(desc(reports.createdAt))
        .limit(20),
      db.select({ made: count() }).from(reports).where(eq(reports.reporterId, id)),
      // Ses sorties : créées ou rejointes, les plus récentes d'abord.
      db
        .select({ activity: activities })
        .from(participations)
        .innerJoin(activities, eq(activities.id, participations.activityId))
        .where(eq(participations.userId, id))
        .orderBy(desc(activities.startsAt))
        .limit(20),
    ]);

  const rows = await toAdminActivityRows(
    db,
    activityRows.map((r) => r.activity),
    now,
  );
  const u = row.user;
  return {
    ...toAdminUserRow(u, row.openReports),
    birthDate: u.birthDate,
    status: u.status,
    neighborhood: u.neighborhood,
    interests: u.interests,
    providers: [...new Set(identities.map((i) => i.provider))],
    trust,
    history,
    reportsReceived: await toAdminReports(db, receivedRows),
    reportsMade: made,
    activities: rows.map((a) => ({
      ...a,
      role: a.creator.id === id ? ('creator' as const) : ('participant' as const),
    })),
  };
}
