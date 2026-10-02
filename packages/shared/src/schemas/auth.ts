import { z } from 'zod';
import { meSchema } from './user';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const emailStartInputSchema = z.object({ email: emailSchema });

export const emailVerifyInputSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .transform((s) => s.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'errors.code_format')),
});

export const oauthInputSchema = z.object({
  provider: z.enum(['apple', 'google']),
  idToken: z.string().min(1),
  firstName: z.string().trim().min(1).max(30).optional(), // Apple ne le transmet qu'à la 1re connexion
});

export const refreshInputSchema = z.object({ refreshToken: z.string().min(1) });

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(), // secondes
});

// user = null : compte créé mais onboarding pas encore fait.
export const authResultSchema = z.object({ tokens: authTokensSchema, user: meSchema.nullable() });

export const pushTokenInputSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

export const avatarUploadInputSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
export const avatarUploadOutputSchema = z.object({
  uploadUrl: z.url(),
  method: z.literal('PUT'),
  headers: z.record(z.string(), z.string()),
  publicUrl: z.url(),
});

export type AuthTokens = z.infer<typeof authTokensSchema>;
export type AuthResult = z.infer<typeof authResultSchema>;
