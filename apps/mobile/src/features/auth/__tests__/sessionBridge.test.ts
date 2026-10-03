import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { useSessionStore } from '@/state/session';
import { connectSession, handleApiError, refreshAccessToken } from '../sessionBridge';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@/api/client', () => ({
  apiClient: { request: jest.fn() },
  connectApiSession: jest.fn(),
}));

const request = jest.mocked(apiClient.request);
const OLD = { accessToken: 'vieux', refreshToken: 'r-vieux', expiresIn: 900 };
const NEW = { accessToken: 'neuf', refreshToken: 'r-neuf', expiresIn: 900 };
const ME = {
  id: 'u_awa',
  firstName: 'Awa',
  moderation: { status: 'suspended', suspendedUntil: '2099-01-01T00:00:00Z' },
};

describe('pont session ↔ API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ status: 'signedIn', tokens: OLD, me: null, firstNameHint: null });
  });

  it('rafraîchit et enregistre les nouveaux jetons', async () => {
    request.mockResolvedValueOnce(NEW as never);
    await expect(refreshAccessToken()).resolves.toBe('neuf');
    expect(request).toHaveBeenCalledWith('auth.refresh', { refreshToken: 'r-vieux' });
    expect(useSessionStore.getState().tokens).toEqual(NEW);
  });

  it('refresh refusé par le serveur : déconnexion propre', async () => {
    request.mockRejectedValueOnce(new ApiError('unauthorized', 'révoqué', 401));
    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(useSessionStore.getState().status).toBe('signedOut');
  });

  it('panne réseau pendant le refresh : on garde la session', async () => {
    request.mockRejectedValueOnce(new ApiError('network', 'hors ligne'));
    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(useSessionStore.getState().status).toBe('signedIn');
  });

  it('déconnexion : révoque le refresh token et vide le cache', async () => {
    request.mockResolvedValue({ ok: true } as never);
    const queryClient = new QueryClient();
    queryClient.setQueryData(['x'], 1);
    const unsubscribe = connectSession(queryClient);
    await useSessionStore.getState().signOut();
    expect(request).toHaveBeenCalledWith('auth.logout', { refreshToken: 'r-vieux' });
    expect(queryClient.getQueryData(['x'])).toBeUndefined();
    unsubscribe();
  });

  it('compte suspendu en cours de route : le profil est relu', async () => {
    request.mockResolvedValueOnce(ME as never);
    await handleApiError(new ApiError('account_suspended', 'suspendu', 403));
    expect(request).toHaveBeenCalledWith('me.get', {});
    expect(useSessionStore.getState().status).toBe('suspended');
  });

  it('les autres erreurs ne relisent pas le profil', async () => {
    await handleApiError(new ApiError('activity_full', 'complet', 409));
    expect(request).not.toHaveBeenCalled();
  });
});
