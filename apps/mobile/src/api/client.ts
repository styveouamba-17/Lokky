import { env } from '@/lib/env';
import { createHttpClient, createSingleFlight } from './httpClient';
import { createHybridClient } from './hybridClient';
import { createMockDb } from './mock/db';
import { mockHandlers } from './mock/handlers';
import { createMockClient } from './mock/mockClient';
import { createMockSocket } from './mock/mockSocket';
import { createIoSocket } from './realtime/ioSocket';
import type { RealtimeSocket } from './realtime/types';
import type { ApiClient } from './types';

// api/ n'importe pas state/ (sens des dépendances) : la session se branche ici au démarrage
// (features/auth/sessionBridge.ts).
interface SessionHooks {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
}
let hooks: SessionHooks = { getAccessToken: () => null, refreshAccessToken: async () => null };
const refreshOnce = createSingleFlight(() => hooks.refreshAccessToken());

export function connectApiSession(next: SessionHooks) {
  hooks = next;
}

// En mode mock, le client et le socket partagent les mêmes données en mémoire.
function createTransport(): { apiClient: ApiClient; realtime: RealtimeSocket } {
  if (env.apiMode === 'mock') {
    const db = createMockDb(new Date());
    return {
      apiClient: createMockClient({ handlers: mockHandlers, db }),
      realtime: createMockSocket({ db }),
    };
  }
  const http = createHttpClient({
    baseUrl: env.apiUrl,
    getAccessToken: () => hooks.getAccessToken(),
    refreshAccessToken: refreshOnce,
  });
  const realtime = createIoSocket({
    url: env.apiUrl,
    getAccessToken: () => hooks.getAccessToken(),
    refreshAccessToken: refreshOnce,
  });
  if (env.apiMode === 'hybrid') {
    // Routes pas encore codées côté backend : servies par la simulation. Le temps réel, lui,
    // vient du vrai serveur.
    const db = createMockDb(new Date(), { viewerOnboarded: true });
    return {
      apiClient: createHybridClient(http, createMockClient({ handlers: mockHandlers, db })),
      realtime,
    };
  }
  return { apiClient: http, realtime };
}

export const { apiClient, realtime } = createTransport();
