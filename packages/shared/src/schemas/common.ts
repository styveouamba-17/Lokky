import { z } from 'zod';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_COVERS,
  CITIES,
  LIMITS,
  NEIGHBORHOOD_IDS,
} from '../constants';

export const idSchema = z.string().min(1);
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const citySchema = z.enum(CITIES);
export const categorySchema = z.enum(ACTIVITY_CATEGORIES);
export const activityCoverSchema = z.enum(ACTIVITY_COVERS);
// En lecture, une couverture inconnue (ajoutée après cette version de l'app) reste acceptée :
// l'app retombe alors sur la couverture automatique de la catégorie.
export const activityCoverIdSchema = z.string().min(1).max(64).nullable().default(null);
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
