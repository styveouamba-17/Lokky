import type { Me } from '@lokky/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { createMockDb } from '@/api/mock/db';
import { mockHandlers } from '@/api/mock/handlers';
import { createMockClient } from '@/api/mock/mockClient';
import { toMe } from '@/api/mock/serializers';
import { useSessionStore } from '@/state/session';
import { renderWithProviders } from '@/test/render';

// Mercredi 7 octobre 2026, 10h à Dakar : heure figée, pour que « ce soir » reste à venir.
export const TEST_NOW = new Date('2026-10-07T10:00:00Z');

// Vrai client simulé (données de Dakar, sans latence) derrière l'API d'une feature.
export function makeTestClient() {
  const db = createMockDb(TEST_NOW, { viewerOnboarded: true });
  const client = createMockClient({
    handlers: mockHandlers,
    db,
    now: () => TEST_NOW,
    sleep: () => Promise.resolve(),
  });
  const viewer = db.users.get('u_awa');
  if (!viewer) throw new Error('Spectateur simulé manquant');
  return { client, me: toMe(viewer) };
}

export function signInAs(me: Me) {
  useSessionStore.setState({
    status: 'signedIn',
    tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    me,
    firstNameHint: null,
  });
}

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderWithProviders(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
