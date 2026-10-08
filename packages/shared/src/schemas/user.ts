import { z } from 'zod';
import { LIMITS, USER_STATUSES } from '../constants';
import { ageInYears } from '../time';
import { categorySchema, idSchema, isoDateTimeSchema, neighborhoodSchema } from './common';

export const userStatusSchema = z.enum(USER_STATUSES);
export const moderationStatusSchema = z.enum(['active', 'warned', 'suspended', 'banned']);

export const trustStatsSchema = z.object({
  activitiesAttended: z.number().int().nonnegative(),
  // null tant qu'il n'y a pas d'historique : l'interface affiche « Nouveau », pas « 0 % ».
  attendanceRate: z.number().min(0).max(1).nullable(),
  activitiesCreated: z.number().int().nonnegative(),
  creatorRating: z.number().min(1).max(5).nullable(),
  creatorReviewCount: z.number().int().nonnegative(),
});

export const userPreviewSchema = z.object({
  id: idSchema,
  firstName: z.string().min(1),
  avatarUrl: z.url().nullable(),
});

export const userSchema = userPreviewSchema.extend({
  status: userStatusSchema,
  neighborhood: neighborhoodSchema,
  interests: z.array(categorySchema),
  trust: trustStatsSchema,
});

// Profil public vu par quelqu'un d'autre : ce que le spectateur peut faire avec cette personne.
export const userProfileSchema = userSchema.extend({
  relationship: z.object({
    // Messages privés seulement après une sortie partagée (spec §6.3, règle 4).
    canMessage: z.boolean(),
    // Le spectateur a bloqué cette personne (spec §6.3, règle 6).
    isBlocked: z.boolean(),
  }),
});

export const preferencesSchema = z.object({
  language: z.enum(['fr', 'en']),
  theme: z.enum(['system', 'light', 'dark']),
  notifications: z.object({
    messages: z.boolean(),
    activityUpdates: z.boolean(),
    reminders: z.boolean(),
  }),
});

export const meSchema = userSchema.extend({
  email: z.email(),
  birthDate: z.iso.date(),
  preferences: preferencesSchema,
  moderation: z.object({
    status: moderationStatusSchema,
    suspendedUntil: isoDateTimeSchema.nullable(),
    // Dernier avertissement de l'équipe : l'app l'affiche une fois, puis s'en souvient.
    warnedAt: isoDateTimeSchema.nullable(),
  }),
});

const firstNameSchema = z
  .string()
  .trim()
  .min(LIMITS.user.firstNameMin)
  .max(LIMITS.user.firstNameMax);

const interestsSchema = z
  .array(categorySchema)
  .min(LIMITS.user.interestsMin)
  .max(LIMITS.user.interestsMax)
  .refine((list) => new Set(list).size === list.length, { message: 'errors.duplicate_interests' });

export function makeOnboardingProfileSchema(now: () => Date = () => new Date()) {
  return z.object({
    firstName: firstNameSchema,
    birthDate: z.iso
      .date()
      .refine((d) => ageInYears(d, now()) >= LIMITS.user.minAge, { message: 'errors.age_min' })
      .refine((d) => ageInYears(d, now()) <= LIMITS.user.maxAge, { message: 'errors.age_max' }),
    status: userStatusSchema,
    neighborhood: neighborhoodSchema,
    interests: interestsSchema,
  });
}
export const onboardingProfileSchema = makeOnboardingProfileSchema();

export const updateMeInputSchema = z
  .object({
    firstName: firstNameSchema,
    status: userStatusSchema,
    neighborhood: neighborhoodSchema,
    interests: interestsSchema,
    avatarUrl: z.url().nullable(),
    preferences: preferencesSchema,
  })
  .partial();

export type ModerationStatus = z.infer<typeof moderationStatusSchema>;
export type TrustStats = z.infer<typeof trustStatsSchema>;
export type UserPreview = z.infer<typeof userPreviewSchema>;
export type User = z.infer<typeof userSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type Me = z.infer<typeof meSchema>;
export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;
export type UpdateMeInput = z.infer<typeof updateMeInputSchema>;
