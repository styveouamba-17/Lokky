import type { ClientToServerEvents, ServerToClientEvents } from '@lokky/shared';
import { io, type Socket } from 'socket.io-client';
import { createListeners, type RealtimeSocket } from './types';

export interface IoSocketOptions {
  url: string;
  getAccessToken: () => string | null;
  // Jeton expiré à la connexion : on le rafraîchit puis on retente (spec §7.2).
  refreshAccessToken: () => Promise<string | null>;
}

export function createIoSocket({
  url,
  getAccessToken,
  refreshAccessToken,
}: IoSocketOptions): RealtimeSocket {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
    autoConnect: false,
    transports: ['websocket'],
    // Fonction : relue à chaque tentative, donc toujours avec le dernier jeton.
    auth: (cb) => cb({ token: getAccessToken() }),
  });
  const connection = createListeners<(connected: boolean) => void>();

  socket.on('connect', () => connection.emit(true));
  socket.on('disconnect', () => connection.emit(false));
  socket.on('connect_error', (error) => {
    // Le serveur refuse le jeton : Socket.IO ne retente pas seul dans ce cas.
    if (socket.active || error.message !== 'unauthorized') return;
    void refreshAccessToken().then((token) => {
      if (token) socket.connect();
    });
  });

  return {
    connect: () => void socket.connect(),
    disconnect: () => void socket.disconnect(),
    isConnected: () => socket.connected,
    on(event, listener) {
      // Les génériques de Socket.IO ne se laissent pas réduire à un événement choisi par l'appelant.
      socket.on(event, listener as never);
      return () => void socket.off(event, listener as never);
    },
    emit(event, ...args) {
      socket.emit(event, ...args);
    },
    onConnectionChange: connection.add,
  };
}
