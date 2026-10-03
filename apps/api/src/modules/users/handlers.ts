import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import { viewer, type Handlers, type HandlerContext } from '../../http/context';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';
import { AVATAR_MAX_BYTES, avatarPrefix } from '../../services/avatarStorage';
import { trustOf } from '../trust/stats';
import { findUser, isOnboarded, toMe, type UserRow } from './users';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;

async function currentUser(ctx: HandlerContext): Promise<UserRow> {
  const row = await findUser(ctx.db, viewer(ctx));
  if (!row || row.deletedAt) throw new HttpError('unauthorized', 'Compte introuvable.');
  return row;
}

async function update(ctx: HandlerContext, id: string, changes: Partial<UserRow>) {
  const [row] = await ctx.db.update(users).set(changes).where(eq(users.id, id)).returning();
  if (!row) throw new HttpError('unauthorized', 'Compte introuvable.');
  return row;
}

// Profil de la personne connectée (spec app §6.1 : onboarding, réglages, photo).
export const usersHandlers: Handlers = {
  'me.get': async (_input, ctx) => {
    const row = await currentUser(ctx);
    if (!isOnboarded(row)) throw new HttpError('onboarding_required', 'Profil à compléter.');
    return toMe(row, await trustOf(ctx.db, row.id, ctx.now()));
  },

  // L'âge (18 ans minimum) est déjà vérifié par le schéma du contrat. Refaire l'onboarding
  // met simplement le profil à jour.
  'me.completeOnboarding': async (profile, ctx) => {
    const row = await currentUser(ctx);
    const updated = await update(ctx, row.id, {
      ...profile,
      // Une fois le profil créé, la date de naissance ne change plus (contrôle des 18 ans).
      birthDate: row.onboardedAt && row.birthDate ? row.birthDate : profile.birthDate,
      onboardedAt: row.onboardedAt ?? ctx.now(),
    });
    return toMe(updated, await trustOf(ctx.db, row.id, ctx.now()));
  },

  'me.update': async (changes, ctx) => {
    const row = await currentUser(ctx);
    if (!isOnboarded(row)) throw new HttpError('onboarding_required', 'Profil à compléter.');
    // Une photo ne peut venir que de notre stockage, dans le dossier de la personne.
    const storage = ctx.services.avatars;
    if (changes.avatarUrl && changes.avatarUrl !== row.avatarUrl) {
      if (!storage?.ownsUrl(row.id, changes.avatarUrl)) {
        throw new HttpError('validation', 'avatarUrl : photo inconnue.');
      }
      const size = await storage.sizeOf(changes.avatarUrl);
      if (size === null) throw new HttpError('validation', 'avatarUrl : photo introuvable.');
      if (size > AVATAR_MAX_BYTES) {
        await storage.remove(changes.avatarUrl);
        throw new HttpError('validation', 'avatarUrl : photo trop lourde (2 Mo maximum).');
      }
    }
    return toMe(await update(ctx, row.id, changes), await trustOf(ctx.db, row.id, ctx.now()));
  },

  'me.avatarUploadUrl': async ({ contentType }, ctx) => {
    const row = await currentUser(ctx);
    const storage = ctx.services.avatars;
    if (!storage) throw new HttpError('internal', 'Envoi de photo indisponible.', 503);
    const key = `${avatarPrefix(row.id)}${uuidv7(ctx.now().getTime())}.${EXTENSIONS[contentType]}`;
    const { uploadUrl, headers } = await storage.presignUpload(key, contentType);
    return { uploadUrl, method: 'PUT' as const, headers, publicUrl: storage.publicUrl(key) };
  },
};
