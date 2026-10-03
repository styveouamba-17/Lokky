import { isApiError } from '@/api/errors';
import type { TFunction } from 'i18next';

// Message d'erreur affichable pour une connexion qui échoue.
export function authErrorMessage(error: unknown, t: TFunction, provider?: string): string {
  if (isApiError(error)) {
    return error.code === 'network' || error.code === 'timeout'
      ? t('login.errors.network')
      : t('login.errors.generic');
  }
  return provider ? t('login.errors.provider', { provider }) : t('login.errors.generic');
}
