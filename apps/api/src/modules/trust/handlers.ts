import { and, eq, inArray, ne } from 'drizzle-orm';
import { participations, reviews } from '../../db/schema';
import { viewer, type Handlers } from '../../http/context';
import { HttpError } from '../../http/errors';
import { findActivity } from '../activities/handlers';
import { statusOf } from '../activities/views';

// Avis et présence (spec backend §7, règle 7) : ils nourrissent les statistiques de confiance.
export const trustHandlers: Handlers = {
  'reviews.create': async ({ activityId, creatorRating, comment }, ctx) => {
    const me = viewer(ctx);
    const activity = await findActivity(ctx.db, activityId);
    if (statusOf(activity, ctx.now()) !== 'past') {
      throw new HttpError('conflict', 'La sortie n’est pas terminée.');
    }
    if (activity.creatorId === me) {
      throw new HttpError('forbidden', 'On ne note pas sa propre sortie.');
    }
    const [participant] = await ctx.db
      .select({ userId: participations.userId })
      .from(participations)
      .where(and(eq(participations.activityId, activityId), eq(participations.userId, me)));
    if (!participant) {
      throw new HttpError('not_participant', 'Tu n’as pas participé à cette sortie.');
    }
    const inserted = await ctx.db
      .insert(reviews)
      .values({
        activityId,
        authorId: me,
        rating: creatorRating,
        comment: comment || null,
        createdAt: ctx.now(),
      })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0) throw new HttpError('conflict', 'Avis déjà laissé.');
    return { ok: true as const };
  },

  // Le créateur indique qui est venu, une seule fois, pour ses participants.
  'activities.attendance': async ({ activityId, attendance }, ctx) => {
    const me = viewer(ctx);
    const activity = await findActivity(ctx.db, activityId);
    if (activity.creatorId !== me) {
      throw new HttpError('forbidden', 'Seul le créateur indique qui est venu.');
    }
    if (statusOf(activity, ctx.now()) !== 'past') {
      throw new HttpError('conflict', 'La sortie n’est pas terminée.');
    }
    const members = await ctx.db
      .select({ userId: participations.userId, attended: participations.attended })
      .from(participations)
      .where(and(eq(participations.activityId, activityId), ne(participations.userId, me)));
    if (members.some((m) => m.attended !== null)) {
      throw new HttpError('conflict', 'Présence déjà indiquée.');
    }
    const known = new Set(members.map((m) => m.userId));
    if (attendance.some((a) => !known.has(a.userId))) {
      throw new HttpError('validation', 'attendance : participant inconnu.');
    }
    await ctx.db.transaction(async (tx) => {
      for (const attended of [true, false]) {
        const ids = attendance.filter((a) => a.attended === attended).map((a) => a.userId);
        if (ids.length === 0) continue;
        await tx
          .update(participations)
          .set({ attended })
          .where(
            and(eq(participations.activityId, activityId), inArray(participations.userId, ids)),
          );
      }
    });
    return { ok: true as const };
  },
};
