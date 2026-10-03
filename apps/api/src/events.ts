// Événements de domaine (spec backend §4) : un module annonce ce qui s'est passé ; le chat
// (messages système), le temps réel et les notifications s'y abonnent. Les modules restent
// simples à tester et ne s'appellent pas en cascade.
import type { Message } from '@lokky/shared';

export interface DomainEvents {
  'activity.created': { activityId: string; at: Date };
  'activity.joined': { activityId: string; userId: string; at: Date };
  'activity.left': { activityId: string; userId: string; at: Date };
  'activity.updated': { activityId: string; at: Date };
  'activity.cancelled': { activityId: string; at: Date };
  // Message créé (texte ou système) : destinataires = membres de la conversation.
  'message.created': { message: Message; recipientIds: string[] };
  'conversation.read': { conversationId: string; userId: string; readAt: Date };
}

type Listener<E extends keyof DomainEvents> = (payload: DomainEvents[E]) => Promise<void> | void;

export interface EventBus {
  // background : l'abonné tourne après la réponse (temps réel, notifications), sans la
  // ralentir. Sinon, l'action attend l'abonné (ex. message système « a rejoint le groupe »).
  on<E extends keyof DomainEvents>(
    event: E,
    listener: Listener<E>,
    options?: { background?: boolean },
  ): () => void;
  // Une erreur chez un abonné est journalisée, sans annuler l'action.
  emit<E extends keyof DomainEvents>(event: E, payload: DomainEvents[E]): Promise<void>;
  // Attend la fin des tâches d'arrière-plan en cours (tests, arrêt propre).
  settled(): Promise<void>;
}

export function createEventBus(onError: (error: unknown) => void = () => undefined): EventBus {
  type Entry = { listener: Listener<never>; background: boolean };
  const listeners = new Map<keyof DomainEvents, Set<Entry>>();
  const pending = new Set<Promise<void>>();
  const run = async (listener: Listener<never>, payload: unknown) => {
    try {
      await (listener as (p: unknown) => Promise<void> | void)(payload);
    } catch (error) {
      onError(error);
    }
  };
  return {
    on(event, listener, { background = false } = {}) {
      const set = listeners.get(event) ?? new Set<Entry>();
      const entry: Entry = { listener: listener as Listener<never>, background };
      set.add(entry);
      listeners.set(event, set);
      return () => void set.delete(entry);
    },
    async emit(event, payload) {
      for (const { listener, background } of listeners.get(event) ?? []) {
        if (background) {
          const task = new Promise<void>((resolve) => setImmediate(resolve)).then(() =>
            run(listener, payload),
          );
          pending.add(task);
          void task.finally(() => pending.delete(task));
        } else {
          await run(listener, payload);
        }
      }
    },
    async settled() {
      while (pending.size) await Promise.all([...pending]);
    },
  };
}
