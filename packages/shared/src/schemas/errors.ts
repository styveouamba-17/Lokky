import { z } from 'zod';

export const API_ERROR_CODES = [
  'unauthorized',
  'forbidden',
  'not_found',
  'validation',
  'conflict',
  'activity_full',
  'activity_started',
  'not_participant',
  'rate_limited',
  'account_suspended',
  'account_banned',
  'internal',
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export const apiErrorBodySchema = z.object({
  error: z.object({ code: apiErrorCodeSchema, message: z.string() }),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
