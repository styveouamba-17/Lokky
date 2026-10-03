import { ApiError } from '../errors';
import type { MockHandlers } from './mockClient';
import { blockKey, canMessage, hasBlocked } from './relations';
import { toUserPreview, toUserProfile } from './serializers';

// Sécurité (spec §2, principe 4) : profil vu par un autre, signalement, blocage,
// suppression de compte.
export const safetyHandlers: MockHandlers = {
  'users.get': ({ id }, { db, now, viewerId }) => {
    const found = db.users.get(id);
    if (!found) throw new ApiError('not_found', 'Utilisateur introuvable.', 404);
    // Une personne qui t'a bloqué n'existe plus pour toi.
    if (hasBlocked(db, id, viewerId)) {
      throw new ApiError('not_found', 'Utilisateur introuvable.', 404);
    }
    return toUserProfile(found, {
      canMessage: canMessage(db, viewerId, id, now()),
      isBlocked: hasBlocked(db, viewerId, id),
    });
  },

  // Le signalement est simplement enregistré : la modération se fait côté équipe Lokky.
  'reports.create': (input, { db, now, viewerId }) => {
    db.reports.push({ ...input, reporterId: viewerId, createdAt: now().toISOString() });
    return { ok: true };
  },

  'blocks.list': (_input, { db, viewerId }) =>
    [...db.blocks.entries()].flatMap(([key, blockedAt]) => {
      const [blockerId, blockedId] = key.split('>');
      const user = blockedId ? db.users.get(blockedId) : undefined;
      return blockerId === viewerId && user ? [{ ...toUserPreview(user), blockedAt }] : [];
    }),

  'blocks.create': ({ userId }, { db, now, viewerId }) => {
    if (userId === viewerId) throw new ApiError('validation', 'Impossible de se bloquer.', 400);
    if (!db.users.has(userId)) throw new ApiError('not_found', 'Utilisateur introuvable.', 404);
    db.blocks.set(blockKey(viewerId, userId), now().toISOString());
    return { ok: true };
  },

  'blocks.delete': ({ userId }, { db, viewerId }) => {
    db.blocks.delete(blockKey(viewerId, userId));
    return { ok: true };
  },

  // Le compte simulé repart de zéro : une nouvelle connexion relance l'onboarding.
  'me.delete': (_input, { db, viewerId }) => {
    db.viewerOnboarded = false;
    for (const activity of db.activities.values()) {
      if (activity.creatorId !== viewerId) {
        activity.participantIds = activity.participantIds.filter((id) => id !== viewerId);
      }
    }
    return { ok: true };
  },
};
