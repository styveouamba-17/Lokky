import { viewer, type Handlers } from '../../http/context';
import { HttpError } from '../../http/errors';
import { organizedUpcoming, sharedPastActivity } from '../activities/handlers';
import { hasBlocked, isBlockedEitherWay } from '../safety/blocks';
import { trustOf } from '../trust/stats';
import { findUser, isOnboarded, toPublicUser } from './users';

// Profil public vu par quelqu'un d'autre (spec app §6.2) et ses prochaines sorties organisées.
export const profileHandlers: Handlers = {
  'users.get': async ({ id }, ctx) => {
    const me = viewer(ctx);
    const row = await findUser(ctx.db, id);
    // Une personne qui t'a bloqué n'existe plus pour toi.
    if (!row || row.deletedAt || !isOnboarded(row) || (await hasBlocked(ctx.db, id, me))) {
      throw new HttpError('not_found', 'Utilisateur introuvable.');
    }
    const now = ctx.now();
    const isBlocked = await hasBlocked(ctx.db, me, id);
    return {
      ...toPublicUser(row, await trustOf(ctx.db, id, now)),
      relationship: {
        canMessage: id !== me && !isBlocked && (await sharedPastActivity(ctx.db, me, id, now)),
        isBlocked,
      },
    };
  },

  'users.activities': async ({ id, cursor, limit }, ctx) => {
    const row = await findUser(ctx.db, id);
    if (!row || row.deletedAt || (await isBlockedEitherWay(ctx.db, viewer(ctx), id))) {
      throw new HttpError('not_found', 'Utilisateur introuvable.');
    }
    return organizedUpcoming(ctx, id, cursor, limit);
  },
};
