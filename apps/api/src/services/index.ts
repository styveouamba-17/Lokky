import type { Config } from '../config';
import { createAccessTokens, type AccessTokens } from './accessTokens';
import { createR2AvatarStorage, type AvatarStorage } from './avatarStorage';
import { createIdTokenVerifier, type IdTokenVerifier } from './identityProviders';
import { createConsoleMailer, createResendMailer, type Mailer } from './mailer';

// Services techniques passés aux handlers. Chacun a une interface : les tests les remplacent
// par des versions en mémoire, sans réseau.
export interface Services {
  tokens: AccessTokens;
  mailer: Mailer;
  verifyIdToken: IdTokenVerifier;
  avatars: AvatarStorage | null; // null tant que R2 n'est pas configuré
}

const list = (value: string) =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export async function createServices(config: Config): Promise<Services> {
  return {
    tokens: await createAccessTokens(config.JWT_PRIVATE_KEY),
    mailer: config.RESEND_API_KEY
      ? createResendMailer({ apiKey: config.RESEND_API_KEY, from: config.EMAIL_FROM })
      : createConsoleMailer(),
    verifyIdToken: createIdTokenVerifier({
      appleAudiences: list(config.APPLE_BUNDLE_IDS),
      googleAudiences: list(config.GOOGLE_CLIENT_IDS),
    }),
    avatars:
      config.R2_ACCOUNT_ID &&
      config.R2_ACCESS_KEY_ID &&
      config.R2_SECRET_ACCESS_KEY &&
      config.R2_BUCKET &&
      config.AVATAR_PUBLIC_BASE_URL
        ? createR2AvatarStorage({
            accountId: config.R2_ACCOUNT_ID,
            accessKeyId: config.R2_ACCESS_KEY_ID,
            secretAccessKey: config.R2_SECRET_ACCESS_KEY,
            bucket: config.R2_BUCKET,
            publicBaseUrl: config.AVATAR_PUBLIC_BASE_URL,
          })
        : null,
  };
}
