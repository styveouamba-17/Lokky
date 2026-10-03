import { pushTokens } from '../../db/schema';
import { viewer, type Handlers } from '../../http/context';

// Le téléphone s'enregistre une fois connecté (app : features/notifications/push.ts).
// Un jeton déjà connu passe au compte qui vient de se connecter sur ce téléphone.
export const pushHandlers: Handlers = {
  'me.registerPushToken': async ({ token, platform }, ctx) => {
    const now = ctx.now();
    await ctx.db
      .insert(pushTokens)
      .values({ token, userId: viewer(ctx), platform, updatedAt: now })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: { userId: viewer(ctx), platform, updatedAt: now },
      });
    return { ok: true as const };
  },
};
