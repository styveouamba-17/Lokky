import { isChatReadOnly, LIMITS } from '@lokky/shared';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { conversationMembers, conversations, messages } from '../../db/schema';
import type { EventBus } from '../../events';
import { viewer, type HandlerContext, type Handlers } from '../../http/context';
import { HttpError } from '../../http/errors';
import { decodeCursor, encodeCursor, isOffset } from '../../lib/cursor';
import { uuidv7 } from '../../lib/ids';
import { findActivity, sharedPastActivity } from '../activities/handlers';
import { cutOffIds, isBlockedEitherWay } from '../safety/blocks';
import { findUser, isOnboarded } from '../users/users';
import {
  directKey,
  insertMessage,
  memberConversation,
  membersOf,
  toConversations,
  toMessages,
  type ConversationRow,
} from './conversations';

// Chat de groupe et messages privés (spec backend §7, règles 1, 4, 5, 6).

const pageSize = (limit?: number) => limit ?? LIMITS.pagination.defaultLimit;

const blockedWith = (ctx: HandlerContext) => (userId: string) =>
  isBlockedEitherWay(ctx.db, viewer(ctx), userId);

async function one(ctx: HandlerContext, row: ConversationRow) {
  const [conversation] = await toConversations(
    ctx.db,
    [row],
    viewer(ctx),
    ctx.now(),
    blockedWith(ctx),
  );
  if (!conversation) throw new HttpError('not_found', 'Conversation introuvable.');
  return conversation;
}

// Annonce un nouveau message à tous les membres (temps réel et notifications).
async function publish(
  db: Database,
  events: EventBus,
  row: Awaited<ReturnType<typeof insertMessage>>,
) {
  const [message] = await toMessages(db, [row]);
  await events.emit('message.created', {
    message: message!,
    recipientIds: await membersOf(db, row.conversationId),
  });
}

async function publishUpdate(
  db: Database,
  events: EventBus,
  row: Awaited<ReturnType<typeof insertMessage>>,
) {
  const [message] = await toMessages(db, [row]);
  await events.emit('message.updated', {
    message: message!,
    recipientIds: await membersOf(db, row.conversationId),
  });
}

type MessageCursor = [string, string]; // [createdAt ISO, id]
const isMessageCursor = (v: unknown): v is MessageCursor =>
  Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'string');

export const chatHandlers: Handlers = {
  'conversations.list': async ({ cursor, limit }, ctx) => {
    const me = viewer(ctx);
    const rows = await ctx.db
      .select({ conversation: conversations })
      .from(conversations)
      .innerJoin(
        conversationMembers,
        and(
          eq(conversationMembers.conversationId, conversations.id),
          eq(conversationMembers.userId, me),
        ),
      );
    const hidden = await cutOffIds(ctx.db, me);
    const all = (
      await toConversations(
        ctx.db,
        rows.map((r) => r.conversation),
        me,
        ctx.now(),
      )
    )
      // Une personne bloquée (dans un sens ou dans l'autre) disparaît de la liste.
      .filter((c) => !(c.peer && hidden.has(c.peer.id)))
      // Une conversation privée ouverte sans rien écrire n'est pas une discussion : elle
      // n'apparaît qu'au premier message (elle reste accessible depuis le profil, « Écrire »).
      .filter((c) => c.type === 'group' || c.lastMessage !== null)
      .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
    const offset = decodeCursor(cursor, isOffset) ?? 0;
    const size = pageSize(limit);
    return {
      items: all.slice(offset, offset + size),
      nextCursor: offset + size < all.length ? encodeCursor(offset + size) : null,
    };
  },

  'conversations.get': async ({ id }, ctx) =>
    one(ctx, await memberConversation(ctx.db, id, viewer(ctx))),

  // Une seule conversation par paire ; seulement après une sortie passée ensemble.
  'conversations.openDirect': async ({ userId }, ctx) => {
    const me = viewer(ctx);
    const now = ctx.now();
    const other = await findUser(ctx.db, userId);
    if (!other || other.deletedAt || !isOnboarded(other) || userId === me) {
      throw new HttpError('not_found', 'Utilisateur introuvable.');
    }
    const key = directKey(me, userId);
    const [existing] = await ctx.db
      .select()
      .from(conversations)
      .where(eq(conversations.directKey, key))
      .limit(1);
    if (await isBlockedEitherWay(ctx.db, me, userId)) {
      throw new HttpError('forbidden', 'Vous ne pouvez plus vous écrire.');
    }
    if (existing) return one(ctx, existing);
    if (!(await sharedPastActivity(ctx.db, me, userId, now))) {
      throw new HttpError('forbidden', 'Vous n’avez pas encore partagé de sortie.');
    }
    const id = uuidv7(now.getTime());
    await ctx.db.transaction(async (tx) => {
      await tx
        .insert(conversations)
        .values({ id, type: 'direct', directKey: key, createdAt: now })
        .onConflictDoNothing();
      const [row] = await tx
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.directKey, key));
      await tx
        .insert(conversationMembers)
        .values([me, userId].map((u) => ({ conversationId: row!.id, userId: u, joinedAt: now })))
        .onConflictDoNothing();
    });
    const [created] = await ctx.db
      .select()
      .from(conversations)
      .where(eq(conversations.directKey, key));
    return one(ctx, created!);
  },

  'conversations.markRead': async ({ id }, ctx) => {
    const me = viewer(ctx);
    await memberConversation(ctx.db, id, me);
    const readAt = ctx.now();
    await ctx.db
      .update(conversationMembers)
      .set({ lastReadAt: readAt })
      .where(and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, me)));
    await ctx.events.emit('conversation.read', { conversationId: id, userId: me, readAt });
    return { ok: true as const };
  },

  // Du plus récent au plus ancien : la première page contient les derniers messages.
  'messages.list': async ({ conversationId, cursor, limit }, ctx) => {
    await memberConversation(ctx.db, conversationId, viewer(ctx));
    const size = pageSize(limit);
    const before = decodeCursor(cursor, isMessageCursor);
    const rows = await ctx.db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          before
            ? sql`(${messages.createdAt}, ${messages.id}) < (${before[0]}::timestamptz, ${before[1]}::uuid)`
            : undefined,
        ),
      )
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(size + 1);
    const page = rows.slice(0, size);
    const last = page.at(-1);
    return {
      items: await toMessages(ctx.db, page),
      nextCursor:
        rows.length > size && last ? encodeCursor([last.createdAt.toISOString(), last.id]) : null,
    };
  },

  // Idempotent sur clientId : un message rejoué après une coupure n'est pas dupliqué.
  'messages.send': async ({ conversationId, clientId, body, replyToMessageId }, ctx) => {
    const me = viewer(ctx);
    const row = await memberConversation(ctx.db, conversationId, me);
    const [existing] = await ctx.db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, me),
          eq(messages.clientId, clientId),
        ),
      )
      .limit(1);
    if (existing) return (await toMessages(ctx.db, [existing]))[0]!;

    const now = ctx.now();
    if (row.type === 'direct') {
      const others = (await membersOf(ctx.db, conversationId)).filter((m) => m !== me);
      if (others[0] && (await isBlockedEitherWay(ctx.db, me, others[0]))) {
        throw new HttpError('forbidden', 'Cette discussion est fermée.');
      }
    }
    if (row.type === 'group' && row.activityId) {
      const activity = await findActivity(ctx.db, row.activityId);
      if (isChatReadOnly(activity.startsAt, activity.cancelledAt, now)) {
        throw new HttpError('forbidden', 'Cette discussion est fermée.');
      }
    }
    if (replyToMessageId) {
      const [replied] = await ctx.db
        .select({ id: messages.id, type: messages.type })
        .from(messages)
        .where(and(eq(messages.id, replyToMessageId), eq(messages.conversationId, conversationId)))
        .limit(1);
      if (!replied || replied.type !== 'text') {
        throw new HttpError('not_found', 'Le message auquel répondre est introuvable.');
      }
    }
    const created = await insertMessage(ctx.db, {
      conversationId,
      senderId: me,
      type: 'text',
      body,
      clientId,
      replyToMessageId: replyToMessageId ?? null,
      createdAt: now,
    });
    await ctx.db
      .update(conversationMembers)
      .set({ lastReadAt: now })
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, me),
        ),
      );
    await publish(ctx.db, ctx.events, created);
    return (await toMessages(ctx.db, [created]))[0]!;
  },

  'messages.update': async ({ id, body }, ctx) => {
    const me = viewer(ctx);
    const [found] = await ctx.db.select().from(messages).where(eq(messages.id, id)).limit(1);
    if (!found) throw new HttpError('not_found', 'Message introuvable.');
    const row = await memberConversation(ctx.db, found.conversationId, me);
    if (found.senderId !== me || found.type !== 'text') {
      throw new HttpError('forbidden', 'Tu peux uniquement modifier tes propres messages.');
    }
    const now = ctx.now();
    if (row.type === 'direct') {
      const others = (await membersOf(ctx.db, found.conversationId)).filter((m) => m !== me);
      if (others[0] && (await isBlockedEitherWay(ctx.db, me, others[0]))) {
        throw new HttpError('forbidden', 'Cette discussion est fermée.');
      }
    }
    if (row.type === 'group' && row.activityId) {
      const activity = await findActivity(ctx.db, row.activityId);
      if (isChatReadOnly(activity.startsAt, activity.cancelledAt, now)) {
        throw new HttpError('forbidden', 'Cette discussion est fermée.');
      }
    }
    const [updated] = await ctx.db
      .update(messages)
      .set({ body, editedAt: now })
      .where(and(eq(messages.id, id), eq(messages.senderId, me), eq(messages.type, 'text')))
      .returning();
    if (!updated) throw new HttpError('not_found', 'Message introuvable.');
    await publishUpdate(ctx.db, ctx.events, updated);
    return (await toMessages(ctx.db, [updated]))[0]!;
  },
};

// Messages système du groupe : « Awa a rejoint le groupe » (spec app §6.3, règle 1).
export function registerChatListeners(events: EventBus, db: Database) {
  const announce = async (activityId: string, userId: string, at: Date, action: string) => {
    const [group] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.activityId, activityId));
    const person = await findUser(db, userId);
    if (!group || !person) return;
    const row = await insertMessage(db, {
      conversationId: group.id,
      senderId: null,
      type: 'system',
      body: `${person.firstName ?? 'Quelqu’un'} ${action}`,
      createdAt: at,
    });
    await publish(db, events, row);
  };
  events.on('activity.joined', ({ activityId, userId, at }) =>
    announce(activityId, userId, at, 'a rejoint le groupe'),
  );
  events.on('activity.left', ({ activityId, userId, at }) =>
    announce(activityId, userId, at, 'ne vient plus à cette sortie'),
  );
  events.on('activity.participantRemoved', async ({ activityId, userId, removedBy, at }) => {
    const [group] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.activityId, activityId));
    const [person, organizer] = await Promise.all([findUser(db, userId), findUser(db, removedBy)]);
    if (!group || !person || !organizer) return;
    const row = await insertMessage(db, {
      conversationId: group.id,
      senderId: null,
      type: 'system',
      body: `L’organisateur a retiré ${person.firstName ?? 'un participant'} de la sortie.`,
      createdAt: at,
    });
    await publish(db, events, row);
  });
}
