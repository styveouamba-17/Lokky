import { isChatReadOnly, type Conversation, type Message } from '@lokky/shared';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { conversationMembers, conversations, messages } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';
import { activitiesByIds } from '../activities/handlers';
import { findUsers, toUserPreview } from '../users/users';

export type ConversationRow = typeof conversations.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;

// Une seule conversation privée par paire, quel que soit qui l'ouvre.
export const directKey = (a: string, b: string) => [a, b].sort().join(':');

export async function membersOf(db: Database, conversationId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(eq(conversationMembers.conversationId, conversationId));
  return rows.map((r) => r.userId);
}

// La conversation, si le spectateur en fait partie ; sinon une erreur claire.
export async function memberConversation(
  db: Database,
  conversationId: string,
  viewerId: string,
): Promise<ConversationRow> {
  const [row] = await db
    .select({ conversation: conversations, member: conversationMembers.userId })
    .from(conversations)
    .leftJoin(
      conversationMembers,
      and(
        eq(conversationMembers.conversationId, conversations.id),
        eq(conversationMembers.userId, viewerId),
      ),
    )
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!row) throw new HttpError('not_found', 'Conversation introuvable.');
  if (!row.member) {
    throw row.conversation.type === 'group'
      ? new HttpError('not_participant', 'Tu ne fais pas partie de ce groupe.')
      : new HttpError('forbidden', 'Conversation privée.');
  }
  return row.conversation;
}

export async function toMessages(db: Database, rows: readonly MessageRow[]): Promise<Message[]> {
  const people = await findUsers(
    db,
    rows.flatMap((m) => (m.senderId ? [m.senderId] : [])),
  );
  return rows.map((m) => {
    const sender = m.senderId ? people.get(m.senderId) : undefined;
    return {
      id: m.id,
      clientId: m.clientId,
      conversationId: m.conversationId,
      // Message système, ou auteur dont le compte a été supprimé.
      sender: m.type === 'text' && sender ? toUserPreview(sender) : null,
      type: m.type === 'text' && !sender ? 'system' : m.type,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    };
  });
}

export async function insertMessage(
  db: Database,
  values: Pick<MessageRow, 'conversationId' | 'senderId' | 'type' | 'body'> & {
    clientId?: string | null;
    createdAt: Date;
  },
): Promise<MessageRow> {
  const [row] = await db
    .insert(messages)
    .values({ id: uuidv7(values.createdAt.getTime()), clientId: null, ...values })
    .returning();
  return row!;
}

// Non-lus : messages des autres (hors système) après la dernière lecture.
export async function unreadCounts(
  db: Database,
  viewerId: string,
  conversationIds?: readonly string[],
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      conversationId: messages.conversationId,
      n: sql<number>`count(*)`.mapWith(Number),
    })
    .from(messages)
    .innerJoin(
      conversationMembers,
      and(
        eq(conversationMembers.conversationId, messages.conversationId),
        eq(conversationMembers.userId, viewerId),
      ),
    )
    .where(
      and(
        eq(messages.type, 'text'),
        sql`${messages.senderId} is distinct from ${viewerId}::uuid`,
        sql`${messages.createdAt} > coalesce(${conversationMembers.lastReadAt}, '-infinity')`,
        conversationIds ? inArray(messages.conversationId, [...conversationIds]) : undefined,
      ),
    )
    .groupBy(messages.conversationId);
  return new Map(rows.map((r) => [r.conversationId, r.n]));
}

export async function unreadTotal(db: Database, viewerId: string): Promise<number> {
  let total = 0;
  for (const n of (await unreadCounts(db, viewerId)).values()) total += n;
  return total;
}

// Conversations du contrat, en quelques requêtes pour toute la liste.
export async function toConversations(
  db: Database,
  rows: readonly ConversationRow[],
  viewerId: string,
  now: Date,
  isBlockedWith: (userId: string) => Promise<boolean> = async () => false,
): Promise<Conversation[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const lastRows = await db
    .selectDistinctOn([messages.conversationId])
    .from(messages)
    .where(inArray(messages.conversationId, ids))
    .orderBy(messages.conversationId, sql`${messages.createdAt} desc`, sql`${messages.id} desc`);
  const last = new Map((await toMessages(db, lastRows)).map((m) => [m.conversationId, m]));
  const unread = await unreadCounts(db, viewerId, ids);

  const groupActivities = await activitiesByIds(
    db,
    rows.flatMap((r) => (r.activityId ? [r.activityId] : [])),
  );
  const directPeers = await db
    .select({
      conversationId: conversationMembers.conversationId,
      userId: conversationMembers.userId,
    })
    .from(conversationMembers)
    .where(
      and(
        inArray(
          conversationMembers.conversationId,
          rows.filter((r) => r.type === 'direct').map((r) => r.id),
        ),
        ne(conversationMembers.userId, viewerId),
      ),
    );
  const peerIds = new Map(directPeers.map((p) => [p.conversationId, p.userId]));
  const people = await findUsers(db, [...peerIds.values()]);

  const out: Conversation[] = [];
  for (const row of rows) {
    const lastMessage = last.get(row.id) ?? null;
    const base = {
      id: row.id,
      lastMessage,
      unreadCount: unread.get(row.id) ?? 0,
      updatedAt: lastMessage?.createdAt ?? row.createdAt.toISOString(),
    };
    if (row.type === 'group' && row.activityId) {
      const activity = groupActivities.get(row.activityId);
      if (!activity) continue;
      out.push({
        ...base,
        type: 'group',
        activityId: row.activityId,
        peer: null,
        title: activity.title,
        avatarUrl: null,
        isReadOnly: isChatReadOnly(activity.startsAt, activity.cancelledAt, now),
      });
    } else {
      const peer = people.get(peerIds.get(row.id) ?? '');
      if (!peer) continue;
      const preview = toUserPreview(peer);
      out.push({
        ...base,
        type: 'direct',
        activityId: null,
        peer: preview,
        title: preview.firstName,
        avatarUrl: preview.avatarUrl,
        isReadOnly: await isBlockedWith(peer.id),
      });
    }
  }
  return out;
}
