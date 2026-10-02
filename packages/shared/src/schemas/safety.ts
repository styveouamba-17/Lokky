import { z } from 'zod';
import { LIMITS } from '../constants';
import { idSchema, isoDateTimeSchema } from './common';
import { userPreviewSchema } from './user';

export const reviewInputSchema = z.object({
  activityId: idSchema,
  creatorRating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(LIMITS.review.commentMax).optional(),
});

export const attendanceInputSchema = z.object({
  activityId: idSchema,
  attendance: z.array(z.object({ userId: idSchema, attended: z.boolean() })).min(1),
});

export const reportReasonSchema = z.enum([
  'harassment',
  'inappropriate',
  'fake',
  'dangerous',
  'spam',
  'other',
]);

export const reportInputSchema = z
  .object({
    targetType: z.enum(['user', 'activity', 'message']),
    targetId: idSchema,
    reason: reportReasonSchema,
    details: z.string().trim().max(LIMITS.report.detailsMax).optional(),
  })
  .refine((r) => r.reason !== 'other' || (r.details?.length ?? 0) >= LIMITS.report.detailsMin, {
    message: 'errors.report_details_required',
    path: ['details'],
  });

export const blockInputSchema = z.object({ userId: idSchema });
export const blockedUserSchema = userPreviewSchema.extend({ blockedAt: isoDateTimeSchema });

export type ReviewInput = z.input<typeof reviewInputSchema>;
export type AttendanceInput = z.input<typeof attendanceInputSchema>;
export type ReportInput = z.input<typeof reportInputSchema>;
export type BlockedUser = z.infer<typeof blockedUserSchema>;
