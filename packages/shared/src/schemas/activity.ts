import { z } from 'zod';
import { ACTIVITY_STATUSES, LIMITS } from '../constants';
import {
  categorySchema,
  citySchema,
  coordinatesSchema,
  idSchema,
  isoDateTimeSchema,
  neighborhoodSchema,
  paginationQuerySchema,
} from './common';
import { trustStatsSchema, userPreviewSchema } from './user';

const L = LIMITS.activity;

export const activityStatusSchema = z.enum(ACTIVITY_STATUSES);

export const activityCostSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('free') }),
  z.object({
    type: z.literal('split'),
    estimateFcfa: z.number().int().positive().max(L.estimateFcfaMax).optional(),
  }),
]);

export const activityLocationSchema = z.object({
  name: z.string().trim().min(2).max(L.placeNameMax),
  coordinates: coordinatesSchema,
  neighborhood: neighborhoodSchema.nullable(),
  meetingPoint: z.string().trim().max(L.meetingPointMax).nullable(),
});

export const activityViewerStateSchema = z.object({
  isParticipant: z.boolean(),
  isCreator: z.boolean(),
  canJoin: z.boolean(),
  canLeave: z.boolean(),
  canReview: z.boolean(),
});

const titleSchema = z.string().trim().min(L.titleMin).max(L.titleMax);
const descriptionSchema = z.string().trim().max(L.descriptionMax);
const capacitySchema = z.number().int().min(L.capacityMin).max(L.capacityMax);

export const activitySchema = z
  .object({
    id: idSchema,
    title: titleSchema,
    category: categorySchema,
    description: descriptionSchema,
    startsAt: isoDateTimeSchema,
    location: activityLocationSchema,
    capacity: capacitySchema,
    cost: activityCostSchema,
    creator: userPreviewSchema.extend({ trust: trustStatsSchema }),
    participantCount: z.number().int().min(1),
    participantsPreview: z.array(userPreviewSchema).max(L.participantsPreviewMax),
    firstTimerCount: z.number().int().nonnegative(),
    status: activityStatusSchema,
    city: citySchema,
    distanceKm: z.number().nonnegative().nullable(),
    viewerState: activityViewerStateSchema,
    createdAt: isoDateTimeSchema,
  })
  .refine((a) => a.participantCount <= a.capacity, {
    message: 'errors.participants_over_capacity',
    path: ['participantCount'],
  });

export const activityWhenSchema = z.enum(['tonight', 'weekend', 'all']);

export const activityListQuerySchema = paginationQuerySchema
  .extend({
    when: activityWhenSchema.optional(),
    categories: z.array(categorySchema).optional(),
    freeOnly: z.boolean().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    radiusKm: z.number().min(1).max(L.radiusKmMax).optional(),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: 'errors.lat_lng_together',
  });

export const myActivitiesQuerySchema = paginationQuerySchema.extend({
  scope: z.enum(['upcoming', 'past', 'created']),
});

export function makeCreateActivityInputSchema(now: () => Date = () => new Date()) {
  return z.object({
    title: titleSchema,
    category: categorySchema,
    description: descriptionSchema.default(''),
    startsAt: isoDateTimeSchema.refine(
      (value) => {
        const t = new Date(value).getTime();
        const n = now().getTime();
        return t >= n + L.minLeadMinutes * 60_000 && t <= n + L.maxAheadDays * 86_400_000;
      },
      { message: 'errors.starts_at_range' },
    ),
    location: activityLocationSchema,
    capacity: capacitySchema,
    cost: activityCostSchema,
  });
}
export const createActivityInputSchema = makeCreateActivityInputSchema();

export const updateActivityInputSchema = z.object({
  id: idSchema,
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  startsAt: isoDateTimeSchema.optional(),
  location: activityLocationSchema.optional(),
  capacity: capacitySchema.optional(),
  cost: activityCostSchema.optional(),
});

export type ActivityCost = z.infer<typeof activityCostSchema>;
export type ActivityLocation = z.infer<typeof activityLocationSchema>;
export type ActivityViewerState = z.infer<typeof activityViewerStateSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type ActivityListQuery = z.input<typeof activityListQuerySchema>;
export type CreateActivityInput = z.input<typeof createActivityInputSchema>;
