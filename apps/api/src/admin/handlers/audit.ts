import { ADMIN_PAGE_SIZE, type AuditEntry, type AuditKind } from '@lokky/shared/admin';
import { count, desc, eq, inArray, like, or, type SQL } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { activities, adminAudit, conversationMembers, messages, users } from '../../db/schema';
import { findUsers } from '../../modules/users/users';
import type { AdminHandlers } from '../context';
import { pageParams, UUID } from '../views';

// Familles d'actions du journal (voir les appels à audit() dans les handlers).
const KIND_FILTERS: Record<Exclude<AuditKind, 'all'>, SQL | undefined> = {
  decisions: or(
    like(adminAudit.action, 'user.%'),
    inArray(adminAudit.action, ['report.resolved', 'report.dismissed', 'activity.cancel']),
  ),
  reads: like(adminAudit.action, '%.view'),
  logins: eq(adminAudit.action, 'session.open'),
};

export const adminAuditHandlers: AdminHandlers = {
  'admin.audit.list': async (input, { db }) => {
    const { page, pageSize, offset } = pageParams(input, ADMIN_PAGE_SIZE);
    const kind = input.kind ?? 'all';
    const where = kind === 'all' ? undefined : KIND_FILTERS[kind];
    const [rows, [{ total } = { total: 0 }]] = await Promise.all([
      db
        .select()
        .from(adminAudit)
        .where(where)
        .orderBy(desc(adminAudit.createdAt), desc(adminAudit.id))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(adminAudit).where(where),
    ]);
    const labels = await targetLabels(db, rows);
    const actors = await findUsers(
      db,
      rows.flatMap((r) => (r.actorId ? [r.actorId] : [])),
    );
    const items: AuditEntry[] = rows.map((r) => {
      const actor = r.actorId ? actors.get(r.actorId) : undefined;
      return {
        id: r.id,
        actor: actor ? { id: actor.id, firstName: actor.firstName } : null,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        targetLabel: labels.get(`${r.targetType}:${r.targetId}`) ?? null,
        details: r.details,
        createdAt: r.createdAt.toISOString(),
      };
    });
    return { items, total, page, pageSize };
  },
};

type AuditRow = typeof adminAudit.$inferSelect;

// Nom lisible de chaque cible, par lots : prénom, titre de sortie, membres d'une conversation.
async function targetLabels(db: Database, rows: AuditRow[]): Promise<Map<string, string>> {
  const idsOf = (...types: string[]) => [
    ...new Set(
      rows
        .filter((r) => types.includes(r.targetType) && UUID.test(r.targetId))
        .map((r) => r.targetId),
    ),
  ];
  const userIds = idsOf('user', 'staff');
  const activityIds = idsOf('activity');
  const conversationIds = idsOf('conversation');
  const messageIds = idsOf('message');

  const [people, outings, members, senders] = await Promise.all([
    findUsers(db, userIds),
    activityIds.length
      ? db
          .select({ id: activities.id, title: activities.title })
          .from(activities)
          .where(inArray(activities.id, activityIds))
      : [],
    conversationIds.length
      ? db
          .select({
            conversationId: conversationMembers.conversationId,
            firstName: users.firstName,
          })
          .from(conversationMembers)
          .innerJoin(users, eq(users.id, conversationMembers.userId))
          .where(inArray(conversationMembers.conversationId, conversationIds))
      : [],
    messageIds.length
      ? db
          .select({ id: messages.id, firstName: users.firstName })
          .from(messages)
          .leftJoin(users, eq(users.id, messages.senderId))
          .where(inArray(messages.id, messageIds))
      : [],
  ]);

  const labels = new Map<string, string>();
  for (const id of userIds) {
    const name = people.get(id)?.firstName;
    if (name) {
      labels.set(`user:${id}`, name);
      labels.set(`staff:${id}`, name);
    }
  }
  for (const a of outings) labels.set(`activity:${a.id}`, a.title);
  const byConversation = new Map<string, string[]>();
  for (const m of members) {
    const names = byConversation.get(m.conversationId) ?? [];
    names.push(m.firstName ?? 'Profil incomplet');
    byConversation.set(m.conversationId, names);
  }
  for (const [id, names] of byConversation) labels.set(`conversation:${id}`, names.join(' et '));
  for (const m of senders)
    labels.set(`message:${m.id}`, `message de ${m.firstName ?? 'compte supprimé'}`);
  return labels;
}
