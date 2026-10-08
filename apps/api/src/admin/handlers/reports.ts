import { ADMIN_PAGE_SIZE } from '@lokky/shared/admin';
import { and, asc, count, desc, eq, gt, lte, ne } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { messages, reports } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { staffOf, type AdminHandlers } from '../context';
import {
  adminUserRow,
  audit,
  moderationHistory,
  pageParams,
  toAdminMessages,
  toAdminReports,
  UUID,
} from '../views';

const CONTEXT_MESSAGES = 10;

export const adminReportHandlers: AdminHandlers = {
  // File de traitement : les ouverts du plus ancien au plus récent (premier arrivé, premier
  // traité) ; les traités du plus récent au plus ancien.
  'admin.reports.list': async (input, { db }) => {
    const { page, pageSize, offset } = pageParams(input, ADMIN_PAGE_SIZE);
    const status = input.status ?? 'open';
    const where = and(
      eq(reports.status, status),
      input.targetType ? eq(reports.targetType, input.targetType) : undefined,
    );
    const [rows, [{ total } = { total: 0 }]] = await Promise.all([
      db
        .select()
        .from(reports)
        .where(where)
        .orderBy(status === 'open' ? asc(reports.createdAt) : desc(reports.handledAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(reports).where(where),
    ]);
    return { items: await toAdminReports(db, rows), total, page, pageSize };
  },

  'admin.reports.get': async ({ id }, ctx) => {
    const staff = staffOf(ctx);
    if (!UUID.test(id)) throw new HttpError('not_found', 'Signalement introuvable.');
    const [row] = await ctx.db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!row) throw new HttpError('not_found', 'Signalement introuvable.');

    const relatedRows = await ctx.db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.targetType, row.targetType),
          eq(reports.targetId, row.targetId),
          ne(reports.id, row.id),
        ),
      )
      .orderBy(desc(reports.createdAt))
      .limit(50);
    const [report, ...related] = await toAdminReports(ctx.db, [row, ...relatedRows]);

    // Message signalé : les messages qui l'entourent dans la conversation.
    let context: Awaited<ReturnType<typeof messageContext>> = [];
    if (report!.target.type === 'message' && report!.target.message) {
      const target = report!.target.message;
      context = await messageContext(ctx.db, target.conversationId, new Date(target.createdAt));
      if (target.conversationType === 'direct') {
        await audit(ctx.db, {
          actorId: staff.id,
          action: 'report.context.view',
          targetType: 'conversation',
          targetId: target.conversationId,
          details: { reportId: row.id },
          now: ctx.now(),
        });
      }
    }

    const concernedUser = row.subjectUserId ? await adminUserRow(ctx.db, row.subjectUserId) : null;
    return {
      ...report!,
      context,
      concernedUser,
      concernedHistory: concernedUser ? await moderationHistory(ctx.db, concernedUser.id) : [],
      related,
    };
  },

  // Une même cible signalée par plusieurs personnes forme une seule affaire : la décision
  // clôt tous ses signalements encore ouverts.
  'admin.reports.resolve': async ({ id, status, note }, ctx) => {
    const staff = staffOf(ctx);
    const now = ctx.now();
    if (!UUID.test(id)) throw new HttpError('not_found', 'Signalement introuvable.');
    const [row] = await ctx.db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!row) throw new HttpError('not_found', 'Signalement introuvable.');
    if (row.status !== 'open') throw new HttpError('conflict', 'Signalement déjà traité.');
    const updated = await ctx.db
      .update(reports)
      .set({ status, handledAt: now, handledBy: staff.id, note: note || null })
      .where(
        and(
          eq(reports.targetType, row.targetType),
          eq(reports.targetId, row.targetId),
          eq(reports.status, 'open'),
        ),
      )
      .returning({ id: reports.id });
    await audit(ctx.db, {
      actorId: staff.id,
      action: `report.${status}`,
      targetType: row.targetType,
      targetId: row.targetId,
      details: { reportIds: updated.map((u) => u.id), note: note || null },
      now,
    });
    await ctx.events.emit('reports.changed', {});
    return { updated: updated.length };
  },
};

async function messageContext(db: Database, conversationId: string, at: Date) {
  const inConversation = eq(messages.conversationId, conversationId);
  const [before, after] = await Promise.all([
    db
      .select()
      .from(messages)
      .where(and(inConversation, lte(messages.createdAt, at)))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(CONTEXT_MESSAGES + 1),
    db
      .select()
      .from(messages)
      .where(and(inConversation, gt(messages.createdAt, at)))
      .orderBy(asc(messages.createdAt), asc(messages.id))
      .limit(CONTEXT_MESSAGES),
  ]);
  return toAdminMessages(db, [...before.reverse(), ...after]);
}
