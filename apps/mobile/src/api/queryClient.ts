import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { isRetryable } from './errors';

const MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  return isRetryable(error) && failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}

// Resynchronise les données quand l'app revient au premier plan (remplace le polling).
export function setupFocusManager(): () => void {
  const subscription = AppState.addEventListener('change', (state) => {
    focusManager.setFocused(state === 'active');
  });
  return () => subscription.remove();
}
