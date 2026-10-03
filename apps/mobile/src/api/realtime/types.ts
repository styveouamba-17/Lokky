import type { ClientToServerEvents, ServerToClientEvents } from '@lokky/shared';

export type ServerEvent = keyof ServerToClientEvents;
export type ClientEvent = keyof ClientToServerEvents;

// Connexion temps réel (spec §7.3) : Socket.IO en mode http, MockSocket en mode mock.
// Le socket ne sert qu'à recevoir ; les messages partent par HTTP (messages.send).
export interface RealtimeSocket {
  connect(): void;
  disconnect(): void;
  isConnected(): boolean;
  on<E extends ServerEvent>(event: E, listener: ServerToClientEvents[E]): () => void;
  emit<E extends ClientEvent>(event: E, ...args: Parameters<ClientToServerEvents[E]>): void;
  // Appelé à chaque connexion et déconnexion (resynchronisation à la reconnexion).
  onConnectionChange(listener: (connected: boolean) => void): () => void;
}

export function createListeners<T extends (...args: never[]) => void>() {
  const set = new Set<T>();
  return {
    add(listener: T) {
      set.add(listener);
      return () => void set.delete(listener);
    },
    emit(...args: Parameters<T>) {
      set.forEach((listener) => listener(...args));
    },
  };
}
