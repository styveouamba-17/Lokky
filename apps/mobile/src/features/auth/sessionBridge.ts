import type { QueryClient } from '@tanstack/react-query';
import { apiClient, connectApiSession } from '@/api/client';
import { isApiError } from '@/api/errors';
import { setTokenRevoker, useSessionStore } from '@/state/session';

const session = () => useSessionStore.getState();

// Rafraîchit le jeton d'accès (spec §7.2). Mutualisé par api/client.ts : une seule requête
// même si plusieurs appels reçoivent un 401 en même temps.
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = session().tokens?.refreshToken;
  if (!refreshToken) return null;
  try {
    const tokens = await apiClient.request('auth.refresh', { refreshToken });
    await session().setTokens(tokens);
    return tokens.accessToken;
  } catch (error) {
    // Refus du serveur : la session est perdue, déconnexion propre. Panne réseau : on garde
    // la session, la requête échoue simplement et pourra être relancée.
    if (isApiError(error) && error.status !== null && error.status < 500) {
      await session().signOut({ revoke: false });
    }
    return null;
  }
}

// Compte suspendu ou banni : on recharge le profil, dont l'état de modération pilote la garde.
export async function handleApiError(error: unknown) {
  if (!isApiError(error)) return;
  if (error.code !== 'account_suspended' && error.code !== 'account_banned') return;
  try {
    await session().setMe(await apiClient.request('me.get', {}));
  } catch {
    // le profil sera relu à la prochaine requête
  }
}

// À appeler une fois au démarrage (app/_layout.tsx).
export function connectSession(queryClient: QueryClient) {
  connectApiSession({
    getAccessToken: () => session().tokens?.accessToken ?? null,
    refreshAccessToken,
  });
  setTokenRevoker(({ refreshToken }) => {
    // Au mieux : un échec ne doit pas empêcher de se déconnecter.
    apiClient.request('auth.logout', { refreshToken }).catch(() => undefined);
  });
  return useSessionStore.subscribe((state, previous) => {
    if (previous.status !== 'signedOut' && state.status === 'signedOut') queryClient.clear();
  });
}
