import { env } from '@/lib/env';
import { createHttpClient, createSingleFlight } from './httpClient';
import { createMockDb } from './mock/db';
import { mockHandlers } from './mock/handlers';
import { createMockClient } from './mock/mockClient';
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

export const apiClient: ApiClient =
  env.apiMode === 'mock'
    ? createMockClient({ handlers: mockHandlers, db: createMockDb(new Date()) })
    : createHttpClient({
        baseUrl: env.apiUrl,
        getAccessToken: () => hooks.getAccessToken(),
        refreshAccessToken: refreshOnce,
      });
