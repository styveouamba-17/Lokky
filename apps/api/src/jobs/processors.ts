import { and, eq, gt, inArray, isNotNull, lt, ne, notInArray, or } from 'drizzle-orm';
import type { Database } from '../db/client';
import {
  activities,
  conversationMembers,
  conversations,
  emailCodes,
  messages,
  participations,
  sessions,
  users,
} from '../db/schema';
import { findActivity, participantIdsOf } from '../modules/activities/handlers';
import { statusOf } from '../modules/activities/views';
import { notify, type Notification } from '../modules/push/notify';
import { cutOffIds } from '../modules/safety/blocks';
import { reviewedBy } from '../modules/trust/stats';
import { findUser, findUsers } from '../modules/users/users';
import type { PushSender } from '../services/push';
import type { JobName, JobPayloads } from './types';

export interface ProcessorDeps {
  db: Database;
  push: PushSender;
  now: () => Date;
}

export type Processors = { [N in JobName]: (data: JobPayloads[N]) => Promise<void> };

const DAY_MS = 86_400_000;
export const PURGE_AFTER_DAYS = 30;

const place = (a: { placeName: string; meetingPoint: string | null }) =>
  a.meetingPoint ? `${a.placeName} · ${a.meetingPoint}` : a.placeName;

// Les textes des notifications sont rédigés ici, en français (spec backend §10).
export function createProcessors({ db, push, now }: ProcessorDeps): Processors {
  const activityOrNull = (id: string) => findActivity(db, id).catch(() => null);

  return {
    'activity-reminder': async ({ activityId }) => {
      const activity = await activityOrNull(activityId);
      if (!activity || statusOf(activity, now()) !== 'upcoming') return;
      const ids = await participantIdsOf(db, activityId);
      await notify(
        db,
        push,
        'reminders',
        ids.map((userId) => ({
          userId,
          title: `Dans 2 h : ${activity.title}`,
          body: `Rendez-vous ${place(activity)}. Nanu dem !`,
          data: { type: 'activity_reminder', activityId },
        })),
      );
    },

    'after-activity': async ({ activityId }) => {
      const activity = await activityOrNull(activityId);
      if (!activity || statusOf(activity, now()) !== 'past') return;
      const members = await db
        .select({ userId: participations.userId, attended: participations.attended })
        .from(participations)
        .where(eq(participations.activityId, activityId));
      const creator = await findUser(db, activity.creatorId);
      const others = members.filter((m) => m.userId !== activity.creatorId);
      const out: Notification[] = [];

      for (const m of others) {
        if ((await reviewedBy(db, m.userId, [activityId])).size > 0) continue;
        out.push({
          userId: m.userId,
          title: 'Comment c’était ?',
          body: `Laisse un avis à ${creator?.firstName ?? 'l’organisateur'} pour « ${activity.title} ».`,
          data: { type: 'after_activity', activityId },
        });
      }
      if (others.length > 0 && others.every((m) => m.attended === null)) {
        out.push({
          userId: activity.creatorId,
          title: 'Qui est venu ?',
          body: `Indique qui était là à « ${activity.title} » : ça compte pour la confiance.`,
          data: { type: 'after_activity', activityId },
        });
      }
      await notify(db, push, 'reminders', out);
    },

    'activity-event': async ({ activityId, kind, userId }) => {
      const activity = await activityOrNull(activityId);
      if (!activity) return;
      if (kind === 'joined') {
        if (!userId || userId === activity.creatorId) return;
        const person = await findUser(db, userId);
        await notify(db, push, 'activityUpdates', [
          {
            userId: activity.creatorId,
            title: activity.title,
            body: `${person?.firstName ?? 'Quelqu’un'} vient à ta sortie !`,
            data: { type: 'activity_joined', activityId },
          },
        ]);
        return;
      }
      const ids = (await participantIdsOf(db, activityId)).filter(
        (id) => id !== activity.creatorId,
      );
      await notify(
        db,
        push,
        'activityUpdates',
        ids.map((id) => ({
          userId: id,
          title: kind === 'cancelled' ? 'Sortie annulée' : activity.title,
          body:
            kind === 'cancelled'
              ? `« ${activity.title} » n’aura pas lieu.`
              : 'Le programme ou le point de RDV a changé.',
          data:
            kind === 'cancelled'
              ? { type: 'activity_cancelled', activityId }
              : { type: 'activity_updated', activityId },
        })),
      );
    },

    // Regroupé : une notification par conversation et par personne, avec ce qui reste non lu
    // au moment de l'envoi. Rien si la personne a déjà lu entre-temps.
    'message-push': async ({ conversationId, userId }) => {
      const [membership] = await db
        .select({ lastReadAt: conversationMembers.lastReadAt })
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            eq(conversationMembers.userId, userId),
          ),
        );
      if (!membership) return;
      const cutOff = [...(await cutOffIds(db, userId))];
      const unread = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.type, 'text'),
            ne(messages.senderId, userId),
            membership.lastReadAt ? gt(messages.createdAt, membership.lastReadAt) : undefined,
            cutOff.length ? notInArray(messages.senderId, cutOff) : undefined,
          ),
        )
        .orderBy(messages.createdAt);
      const last = unread.at(-1);
      if (!last) return;

      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId));
      const senders = await findUsers(
        db,
        unread.flatMap((m) => (m.senderId ? [m.senderId] : [])),
      );
      const lastSender = senders.get(last.senderId ?? '')?.firstName ?? 'Quelqu’un';
      const group = conversation?.activityId ? await activityOrNull(conversation.activityId) : null;
      const title = group ? group.title : lastSender;
      const body =
        unread.length > 1
          ? `${unread.length} nouveaux messages`
          : group
            ? `${lastSender} : ${last.body}`
            : last.body;
      await notify(db, push, 'messages', [
        { userId, title, body, data: { type: 'message', conversationId } },
      ]);
    },

    // Effacement définitif 30 jours après la suppression (spec backend §7, règle 9).
    'purge-deleted-accounts': async () => {
      const limit = new Date(now().getTime() - PURGE_AFTER_DAYS * DAY_MS);
      const gone = await db
        .select({ id: users.id })
        .from(users)
        .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, limit)));
      const ids = gone.map((u) => u.id);
      if (ids.length === 0) return;
      await db.transaction(async (tx) => {
        await tx.delete(messages).where(inArray(messages.senderId, ids));
        await tx.delete(activities).where(inArray(activities.creatorId, ids));
        await tx.delete(users).where(inArray(users.id, ids));
      });
    },

    cleanup: async () => {
      const n = now();
      await db.delete(emailCodes).where(lt(emailCodes.expiresAt, n));
      const old = new Date(n.getTime() - PURGE_AFTER_DAYS * DAY_MS);
      await db
        .delete(sessions)
        .where(
          or(
            lt(sessions.expiresAt, n),
            and(isNotNull(sessions.revokedAt), lt(sessions.revokedAt, old)),
          ),
        );
    },
  };
}
