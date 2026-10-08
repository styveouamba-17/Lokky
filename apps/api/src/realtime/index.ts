import type { ClientToServerEvents, ServerToClientEvents } from '@lokky/shared';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server as HttpServer } from 'node:http';
import type { Redis } from 'ioredis';
import { Server } from 'socket.io';
import type { Database } from '../db/client';
import type { EventBus } from '../events';
import { participantIdsOf, findActivity } from '../modules/activities/handlers';
import { toActivities } from '../modules/activities/views';
import { membersOf, unreadTotal } from '../modules/chat/conversations';
import { cutOffIds } from '../modules/safety/blocks';
import { MODERATION_CHANNEL, type ModerationNotice } from '../modules/users/moderation';
import { findUser, isActiveAccount, toUserPreview } from '../modules/users/users';
import type { Services } from '../services';

// Temps réel (spec backend §9). Chaque personne a sa salle « user:{id} » : un événement est
// envoyé aux salles de ses destinataires, ce qui suit automatiquement les arrivées et départs
// dans les groupes (pas de salle de conversation à tenir à jour).

export type RealtimeServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  object,
  { userId: string }
>;

const room = (userId: string) => `user:${userId}`;
const TYPING_INTERVAL_MS = 1000;

export interface RealtimeDeps {
  db: Database;
  services: Services;
  events: EventBus;
  now: () => Date;
  // Plusieurs instances de l'API : les événements passent par Redis.
  redis?: Redis;
}

export function attachRealtime(server: HttpServer, deps: RealtimeDeps): RealtimeServer {
  const { db, services, events, now } = deps;
  const io: RealtimeServer = new Server(server, { serveClient: false, cors: { origin: false } });
  if (deps.redis) io.adapter(createAdapter(deps.redis.duplicate(), deps.redis.duplicate()));

  // Le jeton d'accès arrive dans auth.token (app : src/api/realtime/ioSocket.ts). Refus avec
  // « unauthorized » : l'app rafraîchit son jeton puis se reconnecte.
  io.use((socket, next) => {
    const token = (socket.handshake.auth as { token?: unknown } | undefined)?.token;
    if (typeof token !== 'string') return next(new Error('unauthorized'));
    services.tokens
      .verify(token, now())
      .then(async (userId) => {
        if (!userId || !(await isActiveAccount(db, userId))) {
          return next(new Error('unauthorized'));
        }
        socket.data.userId = userId;
        return next();
      })
      .catch(() => next(new Error('unauthorized')));
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    void socket.join(room(userId));
    let lastTyping = 0;

    // Salles de conversation inutiles ici (diffusion par personne) : acceptées sans effet.
    socket.on('conversation:join', () => undefined);
    socket.on('conversation:leave', () => undefined);

    socket.on('typing', ({ conversationId, isTyping }) => {
      const t = Date.now();
      if (isTyping && t - lastTyping < TYPING_INTERVAL_MS) return;
      lastTyping = t;
      void (async () => {
        const members = await membersOf(db, conversationId);
        if (!members.includes(userId)) return;
        const me = await findUser(db, userId);
        if (!me) return;
        const cutOff = await cutOffIds(db, userId);
        const others = members.filter((m) => m !== userId && !cutOff.has(m)).map(room);
        if (others.length) {
          io.to(others).emit('typing', { conversationId, user: toUserPreview(me), isTyping });
        }
      })().catch(() => undefined);
    });
  });

  const sendUnread = async (userIds: readonly string[]) => {
    for (const id of userIds) {
      io.to(room(id)).emit('unread:update', { total: await unreadTotal(db, id) });
    }
  };

  // Rien n'est livré entre deux personnes qui se sont bloquées (spec app §6.3, règle 6).
  // Pas de total de non-lus ici : l'app le déduit du message reçu (une requête de moins par
  // destinataire et par message).
  events.on(
    'message.created',
    async ({ message, recipientIds }) => {
      const senderId = message.sender?.id;
      const cutOff = senderId ? await cutOffIds(db, senderId) : new Set<string>();
      const recipients = recipientIds.filter((id) => !cutOff.has(id));
      if (recipients.length) io.to(recipients.map(room)).emit('message:new', message);
    },
    { background: true },
  );

  events.on(
    'message.updated',
    async ({ message, recipientIds }) => {
      const senderId = message.sender?.id;
      const cutOff = senderId ? await cutOffIds(db, senderId) : new Set<string>();
      const recipients = recipientIds.filter((id) => !cutOff.has(id));
      if (recipients.length) io.to(recipients.map(room)).emit('message:updated', message);
    },
    { background: true },
  );

  events.on(
    'conversation.read',
    async ({ conversationId, userId, readAt }) => {
      const members = await membersOf(db, conversationId);
      io.to(members.map(room)).emit('conversation:read', {
        conversationId,
        userId,
        readAt: readAt.toISOString(),
      });
      await sendUnread([userId]);
    },
    { background: true },
  );

  // Sortie modifiée : chaque participant reçoit sa propre vue (viewerState lui est propre).
  events.on(
    'activity.updated',
    async ({ activityId }) => {
      const row = await findActivity(db, activityId);
      for (const participantId of await participantIdsOf(db, activityId)) {
        const [activity] = await toActivities(db, [row], { viewerId: participantId, now: now() });
        if (activity) io.to(room(participantId)).emit('activity:updated', activity);
      }
    },
    { background: true },
  );

  events.on(
    'activity.cancelled',
    async ({ activityId }) => {
      const participants = await participantIdsOf(db, activityId);
      if (participants.length)
        io.to(participants.map(room)).emit('activity:cancelled', { activityId });
    },
    { background: true },
  );

  events.on(
    'activity.participantRemoved',
    ({ activityId, userId }) => {
      io.to(room(userId)).emit('activity:participantRemoved', { activityId });
    },
    { background: true },
  );

  // Décisions de modération (script, admin) : la personne est prévenue tout de suite.
  if (deps.redis) {
    const subscriber = deps.redis.duplicate();
    void subscriber.subscribe(MODERATION_CHANNEL);
    subscriber.on('message', (_channel, raw: string) => {
      try {
        const notice = JSON.parse(raw) as ModerationNotice;
        io.to(room(notice.userId)).emit('moderation:update', {
          status: notice.status,
          suspendedUntil: notice.suspendedUntil,
          warnedAt: notice.warnedAt,
        });
      } catch {
        // message illisible : ignoré
      }
    });
    io.engine.on('close', () => subscriber.disconnect());
  }

  return io;
}
