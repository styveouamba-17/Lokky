import type { Conversation } from '@lokky/shared';
import { ApiError } from '../errors';
import type { MockActivity, MockDb, MockDirect, MockMessage } from './db';
import { activityIdOfConversation, directConversationId, usersOfDirect } from './ids';
import type { MockHandlers } from './mockClient';
import { paginate } from './paginate';
import { canMessage, isBlockedEitherWay } from './relations';
import { toDirectConversation, toGroupConversation, toMessage } from './serializers';

// Chat de groupe (spec §6.3, règle 1) et messages privés (règle 4).

let messageCounter = 0;

// Ajoute un message et le diffuse (MockSocket), comme le ferait le serveur.
export function addMessage(
  db: MockDb,
  message: Omit<MockMessage, 'id' | 'clientId'> & { clientId?: string | null },
): MockMessage {
  messageCounter += 1;
  const created: MockMessage = {
    clientId: null,
    ...message,
    id: `m_${new Date(message.createdAt).getTime().toString(36)}_${messageCounter}`,
  };
  const list = db.messages.get(created.conversationId) ?? [];
  db.messages.set(created.conversationId, [...list, created]);
  db.bus.publish(created);
  return created;
}

export function findGroupActivity(db: MockDb, conversationId: string): MockActivity | null {
  const activityId = activityIdOfConversation(conversationId);
  return activityId ? (db.activities.get(activityId) ?? null) : null;
}

// Qui fait partie de la conversation : les participants du groupe, ou les deux personnes.
export function conversationMembers(db: MockDb, conversationId: string): string[] | null {
  const activity = findGroupActivity(db, conversationId);
  if (activity) return activity.participantIds;
  return db.directs.get(conversationId)?.userIds ?? null;
}

type Resolved = { kind: 'group'; activity: MockActivity } | { kind: 'direct'; direct: MockDirect };

function resolve(db: MockDb, conversationId: string, viewerId: string): Resolved {
  const activity = findGroupActivity(db, conversationId);
  if (activity) {
    if (!activity.participantIds.includes(viewerId)) {
      throw new ApiError('not_participant', 'Tu ne fais pas partie de ce groupe.', 403);
    }
    return { kind: 'group', activity };
  }
  const direct = db.directs.get(conversationId);
  if (!direct) throw new ApiError('not_found', 'Conversation introuvable.', 404);
  if (!direct.userIds.includes(viewerId)) {
    throw new ApiError('forbidden', 'Conversation privée.', 403);
  }
  return { kind: 'direct', direct };
}

function present(r: Resolved, db: MockDb, viewerId: string, now: Date): Conversation {
  if (r.kind === 'group') return toGroupConversation(r.activity, db, viewerId, now);
  const [a, b] = r.direct.userIds;
  return toDirectConversation(r.direct, db, viewerId, isBlockedEitherWay(db, a, b));
}

export const chatHandlers: MockHandlers = {
  'conversations.list': (input, { db, now, viewerId }) => {
    const n = now();
    const groups = [...db.activities.values()]
      .filter((a) => a.participantIds.includes(viewerId))
      .map((a) => toGroupConversation(a, db, viewerId, n));
    // Une personne bloquée disparaît de la liste (spec §6.3, règle 6).
    const directs = [...db.directs.values()]
      .filter((d) => d.userIds.includes(viewerId))
      .filter((d) => !isBlockedEitherWay(db, d.userIds[0], d.userIds[1]))
      .map((d) => toDirectConversation(d, db, viewerId, false))
      // Pas de message : pas encore une discussion (comme le vrai backend).
      .filter((c) => c.lastMessage !== null);
    const items = [...groups, ...directs].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
    return paginate(items, input.cursor, input.limit);
  },

  'conversations.get': ({ id }, { db, now, viewerId }) =>
    present(resolve(db, id, viewerId), db, viewerId, now()),

  // Une seule conversation par paire : on retrouve celle qui existe, sinon on la crée.
  'conversations.openDirect': ({ userId }, { db, now, viewerId }) => {
    const n = now();
    if (!db.users.has(userId)) throw new ApiError('not_found', 'Utilisateur introuvable.', 404);
    const id = directConversationId(viewerId, userId);
    const existing = db.directs.get(id);
    if (!existing && !canMessage(db, viewerId, userId, n)) {
      throw new ApiError('forbidden', 'Vous n’avez pas encore partagé de sortie.', 403);
    }
    const direct = existing ?? {
      id,
      userIds: usersOfDirect(id) ?? [viewerId, userId],
      createdAt: n.toISOString(),
    };
    db.directs.set(id, direct);
    return present({ kind: 'direct', direct }, db, viewerId, n);
  },

  'conversations.markRead': ({ id }, { db, now, viewerId }) => {
    resolve(db, id, viewerId);
    db.readAt.set(id, now().toISOString());
    return { ok: true };
  },

  // Du plus récent au plus ancien : la première page contient les derniers messages.
  'messages.list': ({ conversationId, cursor, limit }, { db, viewerId }) => {
    resolve(db, conversationId, viewerId);
    const items = [...(db.messages.get(conversationId) ?? [])]
      .reverse()
      .map((m) => toMessage(m, db));
    return paginate(items, cursor, limit);
  },

  // Idempotent sur clientId : un message rejoué après une coupure n'est pas dupliqué.
  'messages.send': ({ conversationId, clientId, body }, { db, now, viewerId }) => {
    const r = resolve(db, conversationId, viewerId);
    const existing = db.messages.get(conversationId)?.find((m) => m.clientId === clientId);
    if (existing) return toMessage(existing, db);
    const n = now();
    if (present(r, db, viewerId, n).isReadOnly) {
      throw new ApiError('forbidden', 'Cette discussion est fermée.', 403);
    }
    const message = addMessage(db, {
      conversationId,
      clientId,
      senderId: viewerId,
      type: 'text',
      body,
      createdAt: n.toISOString(),
    });
    db.readAt.set(conversationId, message.createdAt);
    return toMessage(message, db);
  },
};
