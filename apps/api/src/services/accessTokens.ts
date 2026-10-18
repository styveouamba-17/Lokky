import { importPKCS8, jwtVerify, SignJWT, type CryptoKey } from 'jose';

// Jetons d'accès (spec backend §5) : JWT signé en Ed25519, valable 15 minutes. Il porte
// l'utilisateur et la famille de session ; la révocation passe par le refresh token.
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const ISSUER = 'lokky-api';
const ALGORITHM = 'EdDSA';

// Personne connectée et connexion (famille de refresh tokens) d'où vient le jeton.
export interface AccessClaims {
  userId: string;
  sessionId: string | null;
}

export interface AccessTokens {
  sign(userId: string, familyId: string, now: Date): Promise<string>;
  // Utilisateur du jeton, ou null s'il est invalide, falsifié ou expiré.
  verify(token: string, now: Date): Promise<string | null>;
  // Comme verify, avec la connexion : déconnexion ciblée du temps réel et des push.
  verifyClaims(token: string, now: Date): Promise<AccessClaims | null>;
}

export async function createAccessTokens(privateKeyPem: string): Promise<AccessTokens> {
  // La clé publique se déduit de la clé privée : un seul secret à gérer.
  const privateKey = await importPKCS8(privateKeyPem.replace(/\\n/g, '\n'), ALGORITHM, {
    extractable: true,
  });
  const publicKey = await derivePublicKey(privateKey);

  const verifyClaims = async (token: string, now: Date): Promise<AccessClaims | null> => {
    try {
      const { payload } = await jwtVerify(token, publicKey, {
        issuer: ISSUER,
        algorithms: [ALGORITHM],
        currentDate: now,
      });
      if (typeof payload.sub !== 'string') return null;
      return {
        userId: payload.sub,
        sessionId: typeof payload.sid === 'string' ? payload.sid : null,
      };
    } catch {
      return null;
    }
  };

  return {
    sign: (userId, familyId, now) =>
      new SignJWT({ sid: familyId })
        .setProtectedHeader({ alg: ALGORITHM })
        .setSubject(userId)
        .setIssuer(ISSUER)
        .setIssuedAt(Math.floor(now.getTime() / 1000))
        .setExpirationTime(Math.floor(now.getTime() / 1000) + ACCESS_TOKEN_TTL_SECONDS)
        .sign(privateKey),

    verify: async (token, now) => (await verifyClaims(token, now))?.userId ?? null,
    verifyClaims,
  };
}

async function derivePublicKey(privateKey: CryptoKey): Promise<CryptoKey> {
  const jwk = await crypto.subtle.exportKey('jwk', privateKey);
  const { d: _private, ...publicJwk } = jwk;
  return crypto.subtle.importKey('jwk', { ...publicJwk, key_ops: ['verify'] }, 'Ed25519', true, [
    'verify',
  ]);
}
