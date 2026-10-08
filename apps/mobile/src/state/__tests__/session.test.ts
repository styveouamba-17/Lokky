import type { Me } from '@lokky/shared';
import * as SecureStore from 'expo-secure-store';
import { statusFor, useSessionStore } from '../session';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

const TOKENS = { accessToken: 'a1', refreshToken: 'r1', expiresIn: 900 };
const ME = {
  id: 'u_awa',
  firstName: 'Awa',
  moderation: { status: 'active', suspendedUntil: null, warnedAt: null },
} as Me;
const reset = () =>
  useSessionStore.setState({ status: 'unknown', tokens: null, me: null, firstNameHint: null });

describe('session', () => {
  beforeEach(async () => {
    await useSessionStore.getState().signOut();
    reset();
  });

  it('nouveau compte : onboarding, et cet état survit au redémarrage', async () => {
    await useSessionStore.getState().signIn({ tokens: TOKENS, user: null }, 'Awa');
    expect(useSessionStore.getState()).toMatchObject({
      status: 'onboarding',
      firstNameHint: 'Awa',
    });
    reset();
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: 'onboarding', tokens: TOKENS });
  });

  it('fin d’onboarding : connecté, profil gardé pour le prochain démarrage', async () => {
    await useSessionStore.getState().signIn({ tokens: TOKENS, user: null });
    await useSessionStore.getState().setMe(ME);
    expect(useSessionStore.getState().status).toBe('signedIn');
    reset();
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: 'signedIn', me: ME });
  });

  it('compte existant : directement connecté', async () => {
    await useSessionStore.getState().signIn({ tokens: TOKENS, user: ME });
    expect(useSessionStore.getState().status).toBe('signedIn');
  });

  it('se déconnecte proprement : plus de tokens ni de profil nulle part', async () => {
    await useSessionStore.getState().signIn({ tokens: TOKENS, user: ME });
    await useSessionStore.getState().signOut();
    reset();
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState()).toMatchObject({ status: 'signedOut', me: null });
  });

  it('un stockage illisible ne bloque pas l’app : on repart déconnecté', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('{pas du json');
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().status).toBe('signedOut');
  });
});

describe('états de modération', () => {
  const NOW = new Date('2026-10-07T10:00:00Z');
  const withModeration = (status: string, suspendedUntil: string | null) =>
    ({ ...ME, moderation: { status, suspendedUntil } }) as Me;

  it('banni ou suspendu bloquent l’accès à l’app', () => {
    expect(statusFor(TOKENS, withModeration('banned', null), NOW)).toBe('banned');
    expect(statusFor(TOKENS, withModeration('suspended', '2026-10-10T00:00:00Z'), NOW)).toBe(
      'suspended',
    );
    expect(statusFor(TOKENS, withModeration('suspended', null), NOW)).toBe('suspended');
  });

  it('une suspension terminée rouvre l’app ; un avertissement ne bloque pas', () => {
    expect(statusFor(TOKENS, withModeration('suspended', '2026-10-01T00:00:00Z'), NOW)).toBe(
      'signedIn',
    );
    expect(statusFor(TOKENS, withModeration('warned', null), NOW)).toBe('signedIn');
  });
});
