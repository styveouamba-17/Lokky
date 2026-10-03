import { and, desc, eq, gt, inArray, isNull, ne } from 'drizzle-orm';
import {
  activities,
  authIdentities,
  blocks,
  participations,
  reports,
  sessions,
  users,
} from '../../db/schema';
import { viewer, type Handlers } from '../../http/context';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';
import { removeGroupMember } from '../chat/groups';
import { findUser, toUserPreview } from '../users/users';

// Sécurité (spec app §2, principe 4) : signalement, blocage, suppression de compte.
export const safetyHandlers: Handlers = {
  // Enregistré pour l'équipe Lokky (admin, spec séparée). Anonyme pour la personne signalée.
  'reports.create': async (input, ctx) => {
    await ctx.db.insert(reports).values({
      id: uuidv7(ctx.now().getTime()),
      reporterId: viewer(ctx),
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: input.details ?? null,
      createdAt: ctx.now(),
    });
    return { ok: true as const };
  },

  'blocks.list': async (_input, ctx) => {
    const rows = await ctx.db
      .select({ user: users, blockedAt: blocks.createdAt })
      .from(blocks)
      .innerJoin(users, eq(users.id, blocks.blockedId))
      .where(eq(blocks.blockerId, viewer(ctx)))
      .orderBy(desc(blocks.createdAt));
    return rows.map((r) => ({ ...toUserPreview(r.user), blockedAt: r.blockedAt.toISOString() }));
  },

  'blocks.create': async ({ userId }, ctx) => {
    const me = viewer(ctx);
    if (userId === me) throw new HttpError('validation', 'Impossible de se bloquer.');
    if (!(await findUser(ctx.db, userId))) {
      throw new HttpError('not_found', 'Utilisateur introuvable.');
    }
    await ctx.db
      .insert(blocks)
      .values({ blockerId: me, blockedId: userId, createdAt: ctx.now() })
      .onConflictDoNothing();
    return { ok: true as const };
  },

  'blocks.delete': async ({ userId }, ctx) => {
    await ctx.db
      .delete(blocks)
      .where(and(eq(blocks.blockerId, viewer(ctx)), eq(blocks.blockedId, userId)));
    return { ok: true as const };
  },

  // Suppression (spec backend §7, règle 9) : le compte est rendu anonyme tout de suite, puis
  // effacé définitivement à J+30 par une tâche planifiée (B6).
  'me.delete': async (_input, ctx) => {
    const me = viewer(ctx);
    const now = ctx.now();
    await ctx.db.transaction(async (tx) => {
      // Ses sorties à venir sont annulées ; il quitte celles des autres.
      await tx
        .update(activities)
        .set({ cancelledAt: now })
        .where(
          and(
            eq(activities.creatorId, me),
            isNull(activities.cancelledAt),
            gt(activities.startsAt, now),
          ),
        );
      const upcoming = await tx
        .select({ id: participations.activityId })
        .from(participations)
        .innerJoin(activities, eq(activities.id, participations.activityId))
        .where(
          and(
            eq(participations.userId, me),
            ne(activities.creatorId, me),
            gt(activities.startsAt, now),
          ),
        );
      const upcomingIds = upcoming.map((u) => u.id);
      if (upcomingIds.length) {
        await tx
          .delete(participations)
          .where(
            and(eq(participations.userId, me), inArray(participations.activityId, upcomingIds)),
          );
        for (const activityId of upcomingIds) await removeGroupMember(tx, activityId, me);
      }
      await tx.delete(sessions).where(eq(sessions.userId, me));
      await tx.delete(authIdentities).where(eq(authIdentities.userId, me));
      await tx
        .update(users)
        .set({
          // L'email est libéré : la même adresse pourra recréer un compte.
          email: `supprime+${me}@lokky.invalid`,
          firstName: 'Utilisateur supprimé',
          birthDate: null,
          avatarUrl: null,
          interests: [],
          preferences: null,
          deletedAt: now,
        })
        .where(eq(users.id, me));
    });
    return { ok: true as const };
  },
};
