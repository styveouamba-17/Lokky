import type { Message, MessageReply } from '@lokky/shared';
import { create } from 'zustand';
import { isRetryable } from '@/api/errors';

// File d'envoi des messages (spec §7.2 et §7.5) : un message s'affiche tout de suite, part
// dès que possible, et reste en file tant qu'il n'y a pas de réseau. Un refus du serveur le
// marque en échec : on peut le renvoyer ou le supprimer.
export type OutgoingStatus = 'waiting' | 'sending' | 'failed';

export interface OutgoingMessage {
  clientId: string;
  conversationId: string;
  body: string;
  replyTo?: MessageReply | null;
  createdAt: string;
  status: OutgoingStatus;
}

interface OutboxState {
  items: OutgoingMessage[];
}

export const useOutbox = create<OutboxState>()(() => ({ items: [] }));

const update = (clientId: string, changes: Partial<OutgoingMessage>) =>
  useOutbox.setState((s) => ({
    items: s.items.map((i) => (i.clientId === clientId ? { ...i, ...changes } : i)),
  }));

const remove = (clientId: string) =>
  useOutbox.setState((s) => ({ items: s.items.filter((i) => i.clientId !== clientId) }));

let counter = 0;
export function newClientId(now: Date = new Date()): string {
  counter += 1;
  return `c${now.getTime().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function enqueue(
  conversationId: string,
  body: string,
  replyToOrNow: MessageReply | Date | null = null,
  now: Date = new Date(),
) {
  const replyTo = replyToOrNow instanceof Date ? null : replyToOrNow;
  const createdAt = replyToOrNow instanceof Date ? replyToOrNow : now;
  const item: OutgoingMessage = {
    clientId: newClientId(now),
    conversationId,
    body: body.trim(),
    replyTo,
    createdAt: createdAt.toISOString(),
    status: 'waiting',
  };
  useOutbox.setState((s) => ({ items: [...s.items, item] }));
  return item;
}

export const retry = (clientId: string) => update(clientId, { status: 'waiting' });
export const discard = remove;

// Le message confirmé arrive (réponse HTTP ou socket) : il remplace sa version locale.
export const confirm = (clientId: string | null) => {
  if (clientId) remove(clientId);
};

export interface FlushOptions {
  send: (item: OutgoingMessage) => Promise<Message>;
  onSent: (message: Message) => void;
  isOnline: () => boolean;
}

let flushing: Promise<void> | null = null;
let requestedAgain = false;

// Envoie les messages en attente, dans l'ordre. S'arrête à la première panne réseau : la file
// repartira à la reconnexion (NetInfo ou socket). Un appel pendant un envoi relance un tour
// à la fin, pour ne jamais oublier un message ajouté entre-temps.
export function flushOutbox(options: FlushOptions): Promise<void> {
  if (flushing) {
    requestedAgain = true;
    return flushing;
  }
  flushing = (async () => {
    do {
      requestedAgain = false;
      await run(options);
    } while (requestedAgain);
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

async function run({ send, onSent, isOnline }: FlushOptions) {
  for (;;) {
    if (!isOnline()) return;
    const next = useOutbox.getState().items.find((i) => i.status === 'waiting');
    if (!next) return;
    update(next.clientId, { status: 'sending' });
    try {
      const message = await send(next);
      remove(next.clientId);
      onSent(message);
    } catch (error) {
      if (isRetryable(error)) {
        update(next.clientId, { status: 'waiting' });
        return;
      }
      update(next.clientId, { status: 'failed' });
    }
  }
}
