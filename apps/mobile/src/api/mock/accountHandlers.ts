import { ApiError } from '../errors';
import type { MockContext, MockHandlers } from './mockClient';
import { toMe } from './serializers';

// Connexion et compte. Le compte connecté est toujours le spectateur simulé (ctx.viewerId).

// Code à saisir en mode mock (aucun email n'est réellement envoyé).
export const MOCK_EMAIL_CODE = '123456';

let tokenCounter = 0;
function mockTokens() {
  tokenCounter += 1;
  return {
    accessToken: `mock-access-${tokenCounter}`,
    refreshToken: `mock-refresh-${tokenCounter}`,
    expiresIn: 15 * 60, // access token de 15 min (spec §7.2)
  };
}

function viewer({ db, viewerId }: MockContext) {
  const found = db.users.get(viewerId);
  if (!found) throw new ApiError('internal', 'Spectateur simulé introuvable.', 500);
  return found;
}

// user: null = compte sans profil, l'onboarding reste à faire.
const signedIn = (ctx: MockContext) => ({
  tokens: mockTokens(),
  user: ctx.db.viewerOnboarded ? toMe(viewer(ctx)) : null,
});

export const accountHandlers: MockHandlers = {
  'auth.emailStart': () => ({ ok: true }),

  'auth.emailVerify': ({ code }, ctx) => {
    if (code !== MOCK_EMAIL_CODE) throw new ApiError('validation', 'Code incorrect.', 400);
    return signedIn(ctx);
  },

  'auth.refresh': () => mockTokens(),
  'auth.logout': () => ({ ok: true }),

  // Le client simulé accepte tout jeton Apple ou Google : aucun backend pour les vérifier.
  'auth.oauth': (_input, ctx) => signedIn(ctx),

  // Aucun push n'est envoyé en mode mock : le jeton est simplement accepté.
  'me.registerPushToken': () => ({ ok: true }),

  'me.get': (_input, ctx) => {
    if (!ctx.db.viewerOnboarded) {
      throw new ApiError('onboarding_required', 'Profil à compléter.', 403);
    }
    return toMe(viewer(ctx));
  },

  'me.completeOnboarding': (profile, ctx) => {
    const updated = { ...viewer(ctx), ...profile };
    ctx.db.users.set(updated.id, updated);
    ctx.db.viewerOnboarded = true;
    return toMe(updated);
  },

  // Les préférences ne sont pas conservées par le client simulé (toMe renvoie les valeurs par défaut).
  'me.update': (changes, ctx) => {
    const updated = { ...viewer(ctx), ...changes };
    ctx.db.users.set(updated.id, updated);
    return toMe(updated);
  },
};
