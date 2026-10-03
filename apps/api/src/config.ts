import { z } from 'zod';

// Variables d'environnement, validées au démarrage : une configuration incomplète arrête le
// serveur tout de suite, avec la liste de ce qui manque. Aucun domaine écrit en dur ailleurs.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.url(),
  // Connexions simultanées à PostgreSQL par processus.
  DB_POOL_SIZE: z.coerce.number().int().positive().default(20),
  REDIS_URL: z.url(),
  PUBLIC_WEB_ORIGIN: z.url(),
  // Derrière un proxy (Caddy en production) : l'IP réelle vient de X-Forwarded-For.
  TRUST_PROXY: z.stringbool().default(false),

  // Jetons d'accès : clé privée Ed25519 (npm run keys:jwt pour en générer une).
  JWT_PRIVATE_KEY: z.string().min(1),

  // Emails : sans clé Resend, le code de connexion s'affiche dans les journaux (développement).
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Lokky <connexion@akylian.com>'),

  // Connexion Apple et Google : audiences acceptées (identifiants publics, séparés par des virgules).
  APPLE_BUNDLE_IDS: z.string().default('com.nach17.Lokky'),
  GOOGLE_CLIENT_IDS: z
    .string()
    .default(
      '421092754029-qio486739a47igklo9dagdg02a33peku.apps.googleusercontent.com,' +
        '421092754029-gqckmi8meuc1vitatmnrg33cp470io4q.apps.googleusercontent.com',
    ),

  // Push : jeton d'accès Expo facultatif (sécurité renforcée des envois, compte Expo).
  EXPO_ACCESS_TOKEN: z.string().optional(),

  // Avatars sur Cloudflare R2 : facultatif en développement (l'envoi de photo répond alors 503).
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  AVATAR_PUBLIC_BASE_URL: z.url().optional(),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')} : ${i.message}`);
    throw new Error(`Configuration invalide :\n${problems.join('\n')}`);
  }
  // En production, les emails doivent vraiment partir.
  if (parsed.data.NODE_ENV === 'production' && !parsed.data.RESEND_API_KEY) {
    throw new Error('Configuration invalide :\n  - RESEND_API_KEY : obligatoire en production');
  }
  return parsed.data;
}
