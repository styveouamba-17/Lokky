import { isApiError } from './errors';
import type { ApiClient } from './types';

// Mode hybride (développement) : le vrai backend d'abord ; une route qu'il ne connaît pas
// encore (501) est servie par le client simulé. On peut ainsi tester la vraie connexion
// pendant que les autres écrans restent sur les données de démo, étape par étape (B3, B4…).
export function createHybridClient(http: ApiClient, mock: ApiClient): ApiClient {
  return {
    async request(route, input) {
      try {
        return await http.request(route, input);
      } catch (error) {
        if (isApiError(error) && error.status === 501) return mock.request(route, input);
        throw error;
      }
    },
  };
}
