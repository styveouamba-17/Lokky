import { exportPKCS8, generateKeyPair } from 'jose';
import { createAccessTokens } from '../src/services/accessTokens';
import { avatarPrefix, type AvatarStorage } from '../src/services/avatarStorage';
import type { VerifiedIdentity } from '../src/services/identityProviders';
import type { Services } from '../src/services';

const AVATAR_BASE = 'https://avatars.test';

// Services de test : vrais jetons signés (clé générée à la volée), emails et fournisseurs
// d'identité en mémoire, stockage d'avatars factice. Aucun accès réseau.
export async function createTestServices() {
  const { privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
  const sentCodes = new Map<string, string>();
  // Jetons Apple ou Google acceptés par le faux vérificateur : « jeton → identité ».
  const identities = new Map<string, VerifiedIdentity>();
  const heavy = new Set<string>();
  const removed: string[] = [];

  const avatars: AvatarStorage = {
    presignUpload: async (key, contentType) => ({
      uploadUrl: `https://r2.test/${key}?X-Amz-Signature=test`,
      headers: { 'Content-Type': contentType },
    }),
    publicUrl: (key) => `${AVATAR_BASE}/${key}`,
    ownsUrl: (userId, url) => url.startsWith(`${AVATAR_BASE}/${avatarPrefix(userId)}`),
    // Les fichiers « envoyés » dans les tests : 100 Ko, sauf ceux marqués trop lourds.
    sizeOf: async (url) => (heavy.has(url) ? 5 * 1024 * 1024 : 100 * 1024),
    remove: async (url) => {
      removed.push(url);
    },
  };

  const services: Services = {
    tokens: await createAccessTokens(await exportPKCS8(privateKey)),
    mailer: {
      sendLoginCode: async (to, code) => {
        sentCodes.set(to, code);
      },
    },
    verifyIdToken: async (_provider, idToken) => identities.get(idToken) ?? null,
    avatars,
  };

  return {
    services,
    lastCode: (email: string) => sentCodes.get(email),
    acceptIdToken: (idToken: string, identity: VerifiedIdentity) =>
      identities.set(idToken, identity),
    AVATAR_BASE,
    markHeavy: (url: string) => heavy.add(url),
    removedAvatars: removed,
  };
}
