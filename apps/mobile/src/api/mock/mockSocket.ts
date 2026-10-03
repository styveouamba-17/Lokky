import type { ServerToClientEvents } from '@lokky/shared';
import { createListeners, type RealtimeSocket, type ServerEvent } from '../realtime/types';
import { addMessage, conversationMembers } from './chatHandlers';
import type { MockDb, MockMessage } from './db';
import { MOCK_VIEWER_ID } from './seed';
import { isBlockedEitherWay } from './relations';
import { toMessage, toUserPreview } from './serializers';

// Réponses des autres participants, pour que le chat simulé ait l'air vivant (spec §7.3).
export const MOCK_REPLIES = [
  'Trop bien, à tout à l’heure !',
  'Quelqu’un part de Fann ? On peut faire la route ensemble',
  'Je serai là 5 minutes en avance',
  'Grave, j’apporte de quoi boire',
  'Super, c’est ma première fois aussi',
  'Ça marche, à toute !',
  'Je partage ma position quand j’arrive',
] as const;

export interface MockSocketOptions {
  db: MockDb;
  viewerId?: string;
  now?: () => Date;
  random?: () => number;
  // Délais simulés : début de la saisie, puis réponse.
  typingDelayMs?: number;
  replyDelayMs?: readonly [number, number];
  schedule?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
}

type AnyListener = (...args: unknown[]) => void;

export function createMockSocket({
  db,
  viewerId = MOCK_VIEWER_ID,
  now = () => new Date(),
  random = Math.random,
  typingDelayMs = 700,
  replyDelayMs = [1800, 3200],
  schedule = setTimeout,
  cancel = clearTimeout,
}: MockSocketOptions): RealtimeSocket {
  const listeners = new Map<ServerEvent, Set<AnyListener>>();
  const connection = createListeners<(connected: boolean) => void>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let unsubscribe: (() => void) | null = null;
  let replyIndex = 0;

  function dispatch<E extends ServerEvent>(event: E, ...args: Parameters<ServerToClientEvents[E]>) {
    listeners.get(event)?.forEach((listener) => listener(...args));
  }

  function later(fn: () => void, ms: number) {
    const timer = schedule(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
  }

  // Un autre participant tape, puis répond au message du spectateur.
  function scheduleReply(message: MockMessage) {
    const members = conversationMembers(db, message.conversationId) ?? [];
    const others = members.filter((id) => id !== viewerId && !isBlockedEitherWay(db, id, viewerId));
    const replierId = others[Math.floor(random() * others.length)];
    const replier = replierId ? db.users.get(replierId) : undefined;
    if (!replier) return;
    const { conversationId } = message;
    const user = toUserPreview(replier);
    const [min, max] = replyDelayMs;

    later(() => dispatch('typing', { conversationId, user, isTyping: true }), typingDelayMs);
    later(
      () => {
        dispatch('typing', { conversationId, user, isTyping: false });
        const body = MOCK_REPLIES[replyIndex % MOCK_REPLIES.length]!;
        replyIndex += 1;
        addMessage(db, {
          conversationId,
          senderId: replier.id,
          type: 'text',
          body,
          createdAt: now().toISOString(),
        });
      },
      typingDelayMs + min + random() * (max - min),
    );
  }

  function onMessage(message: MockMessage) {
    if (!conversationMembers(db, message.conversationId)?.includes(viewerId)) return;
    if (message.senderId && isBlockedEitherWay(db, message.senderId, viewerId)) return;
    dispatch('message:new', toMessage(message, db));
    if (message.senderId === viewerId && message.type === 'text') scheduleReply(message);
  }

  return {
    connect() {
      if (unsubscribe) return;
      unsubscribe = db.bus.subscribe(onMessage);
      connection.emit(true);
    },
    disconnect() {
      if (!unsubscribe) return;
      unsubscribe();
      unsubscribe = null;
      timers.forEach(cancel);
      timers.clear();
      connection.emit(false);
    },
    isConnected: () => unsubscribe !== null,
    on(event, listener) {
      const set = listeners.get(event) ?? new Set<AnyListener>();
      set.add(listener as unknown as AnyListener);
      listeners.set(event, set);
      return () => void set.delete(listener as unknown as AnyListener);
    },
    // Rejoindre une salle ou signaler sa saisie : rien à simuler côté serveur.
    emit: () => undefined,
    onConnectionChange: connection.add,
  };
}
