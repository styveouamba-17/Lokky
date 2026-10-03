import type { AuthResult, AuthTokens, Me } from '@lokky/shared';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

// Session (spec §7.2) : tokens et profil vivent dans SecureStore, jamais en clair.
// Le profil y est gardé pour démarrer directement dans l'app, même hors ligne.
const TOKENS_KEY = 'lokky.session.tokens';
const ME_KEY = 'lokky.session.me';

// onboarding : connecté, mais le profil n'est pas encore rempli.
// suspended / banned : compte modéré (spec §6.2, écrans moderation/*).
export type SessionStatus =
  'unknown' | 'signedOut' | 'onboarding' | 'signedIn' | 'suspended' | 'banned';

interface SessionState {
  status: SessionStatus;
  tokens: AuthTokens | null;
  me: Me | null;
  // Prénom transmis par Apple ou Google, pour préremplir l'onboarding.
  firstNameHint: string | null;
  signIn: (result: AuthResult, firstNameHint?: string) => Promise<void>;
  setMe: (me: Me) => Promise<void>;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  // revoke: false quand la session est déjà perdue (refresh refusé) : rien à révoquer.
  signOut: (options?: { revoke?: boolean }) => Promise<void>;
  hydrate: () => Promise<void>;
}

export function statusFor(
  tokens: AuthTokens | null,
  me: Me | null,
  now: Date = new Date(),
): SessionStatus {
  if (!tokens) return 'signedOut';
  if (!me) return 'onboarding';
  const { status, suspendedUntil } = me.moderation;
  if (status === 'banned') return 'banned';
  // Une suspension terminée redonne accès à l'app, même avant la prochaine synchronisation.
  if (status === 'suspended' && (!suspendedUntil || new Date(suspendedUntil) > now)) {
    return 'suspended';
  }
  return 'signedIn';
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

// Branché par features/auth/sessionBridge.ts : révoque le refresh token côté serveur.
// Appelé avant d'effacer les jetons, sans attendre la réponse (déconnexion instantanée).
let revokeTokens: ((tokens: AuthTokens) => void) | null = null;
export function setTokenRevoker(revoker: (tokens: AuthTokens) => void) {
  revokeTokens = revoker;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  status: 'unknown',
  tokens: null,
  me: null,
  firstNameHint: null,

  signIn: async ({ tokens, user }, firstNameHint) => {
    await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
    if (user) await SecureStore.setItemAsync(ME_KEY, JSON.stringify(user));
    else await SecureStore.deleteItemAsync(ME_KEY);
    set({
      status: statusFor(tokens, user),
      tokens,
      me: user,
      firstNameHint: firstNameHint ?? null,
    });
  },

  // Profil reçu de l'API (fin d'onboarding, modification) : la session passe à signedIn.
  setMe: async (me) => {
    await SecureStore.setItemAsync(ME_KEY, JSON.stringify(me));
    set((s) => ({ me, status: statusFor(s.tokens, me), firstNameHint: null }));
  },

  setTokens: async (tokens) => {
    await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
    set({ tokens });
  },

  signOut: async ({ revoke = true } = {}) => {
    const { tokens } = get();
    if (revoke && tokens) revokeTokens?.(tokens);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKENS_KEY),
      SecureStore.deleteItemAsync(ME_KEY),
    ]);
    set({ status: 'signedOut', tokens: null, me: null, firstNameHint: null });
  },

  hydrate: async () => {
    try {
      const [tokens, me] = await Promise.all([
        readJson<AuthTokens>(TOKENS_KEY),
        readJson<Me>(ME_KEY),
      ]);
      set({ status: statusFor(tokens, me), tokens, me });
    } catch {
      set({ status: 'signedOut', tokens: null, me: null });
    }
  },
}));
