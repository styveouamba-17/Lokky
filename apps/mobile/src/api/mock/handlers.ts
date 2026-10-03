import { getWhenRange, haversineKm, LIMITS, type Activity } from '@lokky/shared';
import { ApiError } from '../errors';
import { accountHandlers } from './accountHandlers';
import { addMessage, chatHandlers } from './chatHandlers';
import type { MockDb } from './db';
import { groupConversationId } from './ids';
import type { MockHandlers } from './mockClient';
import { paginate } from './paginate';
import { isBlockedEitherWay } from './relations';
import { safetyHandlers } from './safetyHandlers';
import { trustHandlers } from './trustHandlers';
import { toActivity, toPublicUser } from './serializers';

function findActivity(db: MockDb, id: string) {
  const activity = db.activities.get(id);
  if (!activity) throw new ApiError('not_found', 'Activité introuvable.', 404);
  return activity;
}

// Message système du chat de groupe : « Awa a rejoint le groupe » (spec §6.3, règle 1).
function announce(db: MockDb, activityId: string, userId: string, at: Date, action: string) {
  const firstName = db.users.get(userId)?.firstName ?? 'Quelqu’un';
  addMessage(db, {
    conversationId: groupConversationId(activityId),
    senderId: null,
    type: 'system',
    body: `${firstName} ${action}`,
    createdAt: at.toISOString(),
  });
}

// Chaque jalon ajoute ses handlers. Une route sans handler renvoie « Route non simulée ».
export const mockHandlers: MockHandlers = {
  ...accountHandlers,
  ...chatHandlers,
  ...trustHandlers,
  ...safetyHandlers,

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
      // Blocage : on ne voit plus les sorties de l'autre, dans les deux sens (spec §6.3, règle 6).
      .filter((a) => !isBlockedEitherWay(db, viewerId, a.creatorId))
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
    announce(db, activity.id, viewerId, now(), 'a rejoint le groupe');
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
    announce(db, activity.id, viewerId, now(), 'a quitté le groupe');
    return toActivity(activity, db, viewerId, now(), null);
  },

  // Mes activités (spec §6.2) : à venir (y compris en cours), passées, créées par moi.
  'activities.mine': ({ scope, cursor, limit }, { db, now, viewerId }) => {
    const n = now();
    const mine = [...db.activities.values()].map((a) => toActivity(a, db, viewerId, n, null));
    const byDate = (x: Activity, y: Activity) => x.startsAt.localeCompare(y.startsAt);
    const isComing = (a: Activity) => a.status === 'upcoming' || a.status === 'ongoing';
    let items: Activity[];
    if (scope === 'upcoming') {
      items = mine.filter((a) => a.viewerState.isParticipant && isComing(a)).sort(byDate);
    } else if (scope === 'past') {
      items = mine
        .filter((a) => a.viewerState.isParticipant && !a.viewerState.isCreator && !isComing(a))
        .sort((x, y) => byDate(y, x));
    } else {
      // Les prochaines d'abord, puis les plus récentes des passées.
      const created = mine.filter((a) => a.viewerState.isCreator);
      items = [
        ...created.filter(isComing).sort(byDate),
        ...created.filter((a) => !isComing(a)).sort((x, y) => byDate(y, x)),
      ];
    }
    return paginate(items, cursor, limit);
  },

  'users.activities': ({ id, cursor, limit }, { db, now, viewerId }) => {
    if (!db.users.has(id)) throw new ApiError('not_found', 'Utilisateur introuvable.', 404);
    const n = now();
    const items = [...db.activities.values()]
      .filter((a) => a.creatorId === id)
      .map((a) => toActivity(a, db, viewerId, n, null))
      .filter((a) => a.status === 'upcoming')
      .sort((x, y) => x.startsAt.localeCompare(y.startsAt));
    return paginate(items, cursor, limit);
  },
};
