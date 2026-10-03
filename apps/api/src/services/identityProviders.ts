import { createRemoteJWKSet, jwtVerify } from 'jose';

// Vérification des jetons d'identité Apple et Google (spec backend §5) avec leurs clés
// publiques, sans SDK. Les clés sont mises en cache par jose.

export interface VerifiedIdentity {
  subject: string; // identifiant stable chez le fournisseur
  email: string | null;
  emailVerified: boolean;
}

export type IdTokenVerifier = (
  provider: 'apple' | 'google',
  idToken: string,
) => Promise<VerifiedIdentity | null>;

const APPLE = {
  jwks: createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')),
  issuer: 'https://appleid.apple.com',
};
const GOOGLE = {
  jwks: createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs')),
  issuer: ['https://accounts.google.com', 'accounts.google.com'],
};

// Apple envoie email_verified en booléen ou en chaîne « true ».
const isTrue = (value: unknown) => value === true || value === 'true';

export function createIdTokenVerifier({
  appleAudiences,
  googleAudiences,
}: {
  appleAudiences: string[];
  googleAudiences: string[];
}): IdTokenVerifier {
  return async (provider, idToken) => {
    const settings =
      provider === 'apple'
        ? { jwks: APPLE.jwks, issuer: APPLE.issuer, audience: appleAudiences }
        : { jwks: GOOGLE.jwks, issuer: GOOGLE.issuer, audience: googleAudiences };
    try {
      const { payload } = await jwtVerify(idToken, settings.jwks, {
        issuer: settings.issuer,
        audience: settings.audience,
      });
      if (typeof payload.sub !== 'string') return null;
      return {
        subject: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
        emailVerified: isTrue(payload.email_verified),
      };
    } catch {
      return null;
    }
  };
}
