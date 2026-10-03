import { onboardingProfileSchema } from '@lokky/shared';
import type { Control, FieldErrors } from 'react-hook-form';
import type { z } from 'zod';

export const onboardingSchema = onboardingProfileSchema;
export type OnboardingFormValues = z.input<typeof onboardingSchema>;
export type OnboardingControl = Control<OnboardingFormValues>;
export type OnboardingErrors = FieldErrors<OnboardingFormValues>;

// Champs validés à chaque étape (la 4e, autorisations, n'a pas de champ).
export const STEP_FIELDS: (keyof OnboardingFormValues)[][] = [
  ['firstName', 'birthDate'],
  ['status', 'neighborhood'],
  ['interests'],
  [],
];
export const STEP_COUNT = STEP_FIELDS.length;
