import { MutationCache, QueryCache, QueryClient, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { isRetryable } from './errors';

const MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  return isRetryable(error) && failureCount < MAX_RETRIES;
}

// onError : vu par toutes les requêtes et mutations (ex. compte suspendu en cours de route).
export function createQueryClient({ onError }: { onError?: (error: unknown) => void } = {}) {
  return new QueryClient({
    queryCache: new QueryCache({ onError: (error) => onError?.(error) }),
    mutationCache: new MutationCache({ onError: (error) => onError?.(error) }),
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
