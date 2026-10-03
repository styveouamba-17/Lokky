import { getWhenRange, haversineKm, LIMITS, type Paginated } from '@lokky/shared';
import { ApiError } from '../errors';
import { accountHandlers } from './accountHandlers';
import type { MockDb } from './db';
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

function findActivity(db: MockDb, id: string) {
  const activity = db.activities.get(id);
  if (!activity) throw new ApiError('not_found', 'Activité introuvable.', 404);
  return activity;
}

// Chaque jalon ajoute ses handlers. Une route sans handler renvoie « Route non simulée ».
export const mockHandlers: MockHandlers = {
  ...accountHandlers,

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

  'activities.get': ({ id }, { db, now, viewerId }) =>
    toActivity(findActivity(db, id), db, viewerId, now(), null),

  // Le créateur est le premier participant (spec §6.3) ; ville unique en v1.
  'activities.create': (input, { db, now, viewerId }) => {
    const n = now();
    const activity = {
      ...input,
      id: `a_${n.getTime().toString(36)}_${db.activities.size}`,
      creatorId: viewerId,
      participantIds: [viewerId],
      cancelledAt: null,
      city: 'dakar' as const,
      createdAt: n.toISOString(),
    };
    db.activities.set(activity.id, activity);
    return toActivity(activity, db, viewerId, n, null);
  },

  'activities.participants': ({ id }, { db }) =>
    findActivity(db, id).participantIds.flatMap((pid) => {
      const found = db.users.get(pid);
      return found ? [toPublicUser(found)] : [];
    }),

  // Règles métier (spec §6.3) : on rejoint une activité à venir et non complète ; on peut
  // la quitter jusqu'au départ, sauf si on l'a créée.
  'activities.join': ({ id }, { db, now, viewerId }) => {
    const activity = findActivity(db, id);
    const view = toActivity(activity, db, viewerId, now(), null);
    if (view.viewerState.isParticipant) return view;
    if (view.status !== 'upcoming') throw new ApiError('activity_started', 'Trop tard.', 409);
    if (view.participantCount >= view.capacity) {
      throw new ApiError('activity_full', 'Activité complète.', 409);
    }
    activity.participantIds.push(viewerId);
    return toActivity(activity, db, viewerId, now(), null);
  },

  'activities.leave': ({ id }, { db, now, viewerId }) => {
    const activity = findActivity(db, id);
    const view = toActivity(activity, db, viewerId, now(), null);
    if (!view.viewerState.isParticipant) {
      throw new ApiError('not_participant', 'Tu ne participes pas.', 409);
    }
    if (!view.viewerState.canLeave) throw new ApiError('forbidden', 'Impossible de quitter.', 403);
    activity.participantIds = activity.participantIds.filter((pid) => pid !== viewerId);
    return toActivity(activity, db, viewerId, now(), null);
  },

  'users.get': ({ id }, { db }) => {
    const found = db.users.get(id);
    if (!found) throw new ApiError('not_found', 'Utilisateur introuvable.', 404);
    return toPublicUser(found);
  },
};
