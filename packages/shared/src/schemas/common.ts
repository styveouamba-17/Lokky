import { z } from 'zod';
import { ACTIVITY_CATEGORIES, CITIES, LIMITS, NEIGHBORHOOD_IDS } from '../constants';

export const idSchema = z.string().min(1);
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const citySchema = z.enum(CITIES);
export const categorySchema = z.enum(ACTIVITY_CATEGORIES);
export const neighborhoodSchema = z.enum(NEIGHBORHOOD_IDS);
export const okSchema = z.object({ ok: z.literal(true) });
export const emptyInputSchema = z.object({});

export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(LIMITS.pagination.maxLimit).optional(),
});

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Paginated<T> = { items: T[]; nextCursor: string | null };
