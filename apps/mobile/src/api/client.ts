import { env } from '@/lib/env';
import { createHttpClient } from './httpClient';
import { createMockDb } from './mock/db';
import { mockHandlers } from './mock/handlers';
import { createMockClient } from './mock/mockClient';
import type { ApiClient } from './types';

export const apiClient: ApiClient =
  env.apiMode === 'mock'
    ? createMockClient({ handlers: mockHandlers, db: createMockDb(new Date()) })
    : createHttpClient({
        baseUrl: env.apiUrl,
        getAccessToken: () => null, // branché sur la session au jalon 2
      });
