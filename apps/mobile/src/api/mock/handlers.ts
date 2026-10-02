import { getWhenRange, haversineKm, LIMITS, type Paginated } from '@lokky/shared';
import { ApiError } from '../errors';
import type { MockHandlers } from './mockClient';
import { toActivity, toPublicUser } from './serializers';

export function paginate<T>(items: T[], cursor?: string, limit?: number): Paginated<T> {
  const size = limit ?? LIMITS.pagination.defaultLimit;
  const offset = cursor === undefined ? 0 : Number(cursor);
  if (!Number.isInteger(offset) || offset < 0) {
    throw new ApiError('validation', 'Curseur invalide.', 400);
  }
  const end = offset + size;
  return { items: items.slice(offset, end), nextCursor: end < items.length ? String(end) : null };
}

// Jalon 1 : lecture des activités et des profils. Les jalons suivants ajoutent leurs handlers.
export const mockHandlers: MockHandlers = {
  'activities.list': (input, { db, now, viewerId }) => {
    const n = now();
    const { from, to } = getWhenRange(input.when ?? 'all', n);
    const origin =
      input.lat !== undefined && input.lng !== undefined
        ? { lat: input.lat, lng: input.lng }
        : null;
    const radius = input.radiusKm ?? LIMITS.activity.defaultRadiusKm;

    const items = [...db.activities.values()]
      .filter((a) => a.cancelledAt === null)
      .filter((a) => {
        const t = new Date(a.startsAt).getTime();
        return t >= from.getTime() && (to === null || t <= to.getTime());
      })
      .filter((a) => !input.categories?.length || input.categories.includes(a.category))
      .filter((a) => !input.freeOnly || a.cost.type === 'free')
      .filter((a) => !origin || haversineKm(origin, a.location.coordinates) <= radius)
      .sort((x, y) => x.startsAt.localeCompare(y.startsAt))
      .map((a) => toActivity(a, db, viewerId, n, origin));

    return paginate(items, input.cursor, input.limit);
  },

  'activities.get': ({ id }, { db, now, viewerId }) => {
    const activity = db.activities.get(id);
    if (!activity) throw new ApiError('not_found', 'Activité introuvable.', 404);
    return toActivity(activity, db, viewerId, now(), null);
  },

  'users.get': ({ id }, { db }) => {
    const found = db.users.get(id);
    if (!found) throw new ApiError('not_found', 'Utilisateur introuvable.', 404);
    return toPublicUser(found);
  },
};
