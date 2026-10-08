import {
  ACTIVITY_EDIT_LOCK_MINUTES,
  getWhenRange,
  haversineKm,
  LIMITS,
  type Activity,
} from '@lokky/shared';
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

  'activities.update': (input, { db, now, viewerId }) => {
    const activity = findActivity(db, input.id);
    if (activity.creatorId !== viewerId) {
      throw new ApiError('forbidden', 'Seul le créateur modifie.', 403);
    }
    const current = toActivity(activity, db, viewerId, now(), null);
    if (current.status !== 'upcoming') {
      throw new ApiError('activity_started', 'La sortie a déjà commencé.', 409);
    }
    const locationMoved =
      input.location !== undefined &&
      (input.location.name !== activity.location.name ||
        input.location.coordinates.lat !== activity.location.coordinates.lat ||
        input.location.coordinates.lng !== activity.location.coordinates.lng ||
        input.location.neighborhood !== activity.location.neighborhood);
    const currentTime = now().getTime();
    const scheduleLocked =
      new Date(activity.startsAt).getTime() - currentTime < ACTIVITY_EDIT_LOCK_MINUTES * 60_000;
    const restricted =
      input.title !== undefined ||
      input.category !== undefined ||
      input.cost !== undefined ||
      locationMoved;
    if (
      activity.participantIds.length > 1 &&
      (restricted ||
        (scheduleLocked && (input.startsAt !== undefined || input.capacity !== undefined)))
    ) {
      throw new ApiError(
        'forbidden',
        scheduleLocked
          ? 'À moins d’une heure du départ, seuls la description et le point de RDV changent.'
          : 'Le programme, le jour, l’heure, la capacité et le point de RDV restent modifiables.',
        403,
      );
    }
    if (input.startsAt !== undefined) {
      const start = new Date(input.startsAt).getTime();
      const minimumLead =
        activity.participantIds.length > 1
          ? ACTIVITY_EDIT_LOCK_MINUTES * 60_000
          : LIMITS.activity.minLeadMinutes * 60_000;
      if (
        start < currentTime + minimumLead ||
        start > currentTime + LIMITS.activity.maxAheadDays * 86_400_000
      ) {
        throw new ApiError('validation', 'startsAt : créneau hors des limites.', 400);
      }
    }
    Object.assign(activity, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
      ...(input.capacity !== undefined && { capacity: input.capacity }),
      ...(input.cost !== undefined && { cost: input.cost }),
      ...(input.location !== undefined && { location: input.location }),
    });
    return toActivity(activity, db, viewerId, now(), null);
  },

  'activities.cancel': ({ id }, { db, now, viewerId }) => {
    const activity = findActivity(db, id);
    if (activity.creatorId !== viewerId) {
      throw new ApiError('forbidden', 'Seul le créateur annule.', 403);
    }
    if (activity.cancelledAt) return toActivity(activity, db, viewerId, now(), null);
    const current = toActivity(activity, db, viewerId, now(), null);
    if (current.status !== 'upcoming') {
      throw new ApiError('activity_started', 'La sortie a déjà commencé.', 409);
    }
    activity.cancelledAt = now().toISOString();
    return toActivity(activity, db, viewerId, now(), null);
  },

  'activities.removeParticipant': ({ id, userId }, { db, now, viewerId }) => {
    const activity = findActivity(db, id);
    if (activity.creatorId !== viewerId) {
      throw new ApiError('forbidden', 'Seul le créateur peut retirer un participant.', 403);
    }
    const current = toActivity(activity, db, viewerId, now(), null);
    if (current.status !== 'upcoming') {
      throw new ApiError('activity_started', 'La sortie a déjà commencé.', 409);
    }
    if (userId === activity.creatorId) {
      throw new ApiError('forbidden', 'Le créateur ne peut pas être retiré.', 403);
    }
    if (!activity.participantIds.includes(userId)) {
      throw new ApiError('not_participant', 'Cette personne ne participe pas.', 403);
    }
    const person = db.users.get(userId);
    if (!person) throw new ApiError('not_found', 'Participant introuvable.', 404);
    activity.participantIds = activity.participantIds.filter(
      (participantId) => participantId !== userId,
    );
    db.removedActivityParticipants.add(`${id}:${userId}`);
    addMessage(db, {
      conversationId: `c_${id}`,
      senderId: null,
      type: 'system',
      body: `L’organisateur a retiré ${person.firstName} de la sortie.`,
      createdAt: now().toISOString(),
    });
    db.bus.publishParticipantRemoved(id, userId);
    return toActivity(activity, db, viewerId, now(), null);
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
    if (db.removedActivityParticipants.has(`${id}:${viewerId}`)) {
      throw new ApiError('forbidden', 'Tu as été retiré de cette sortie.', 403);
    }
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
    announce(db, activity.id, viewerId, now(), 'ne vient plus à cette sortie');
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
