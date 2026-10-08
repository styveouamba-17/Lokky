import { ACTIVITY_ONGOING_HOURS } from '@lokky/shared';
import type { Database } from '../db/client';
import type { EventBus } from '../events';
import { findActivity } from '../modules/activities/handlers';
import { jobIds, type JobScheduler } from './types';

const HOUR_MS = 3_600_000;
export const REMINDER_BEFORE_HOURS = 2;
// Les nouveaux messages d'une conversation sont regroupés pendant ce délai : assez court pour
// une notification quasi immédiate, assez long pour ne pas en envoyer une par message d'une
// rafale. Rien n'est envoyé si la conversation a été lue entre-temps.
export const MESSAGE_PUSH_DELAY_MS = 5_000;

// Transforme les événements de domaine en tâches planifiées (spec backend §10).
export function registerJobListeners(
  events: EventBus,
  scheduler: JobScheduler,
  db: Database,
  now: () => Date,
) {
  // Rappel 2 h avant, et après la sortie (début + 3 h). Replanifié si la date change.
  const planActivity = async (activityId: string) => {
    const activity = await findActivity(db, activityId);
    await scheduler.cancel(jobIds.reminder(activityId));
    await scheduler.cancel(jobIds.after(activityId));
    if (activity.cancelledAt) return;
    const start = activity.startsAt.getTime();
    const reminderAt = new Date(start - REMINDER_BEFORE_HOURS * HOUR_MS);
    if (reminderAt > now()) {
      await scheduler.schedule(
        'activity-reminder',
        { activityId },
        { runAt: reminderAt, jobId: jobIds.reminder(activityId) },
      );
    }
    await scheduler.schedule(
      'after-activity',
      { activityId },
      {
        runAt: new Date(start + ACTIVITY_ONGOING_HOURS * HOUR_MS),
        jobId: jobIds.after(activityId),
      },
    );
  };

  // Toujours en arrière-plan : planifier ne doit jamais ralentir la requête.
  const bg = { background: true };

  events.on(
    'user.moderated',
    ({ userId, status, suspendedUntil }) =>
      scheduler.schedule('moderation-push', {
        userId,
        status,
        suspendedUntil: suspendedUntil?.toISOString() ?? null,
      }),
    bg,
  );
  events.on(
    'activity.created',
    async ({ activityId }) => {
      await planActivity(activityId);
      await scheduler.schedule(
        'activity-discovery',
        { activityId },
        { jobId: jobIds.discovery(activityId) },
      );
    },
    bg,
  );

  events.on(
    'activity.updated',
    async ({ activityId }) => {
      await planActivity(activityId);
      await scheduler.schedule('activity-event', { activityId, kind: 'updated' });
    },
    bg,
  );

  events.on(
    'activity.cancelled',
    async ({ activityId }) => {
      await scheduler.cancel(jobIds.reminder(activityId));
      await scheduler.cancel(jobIds.after(activityId));
      await scheduler.schedule('activity-event', { activityId, kind: 'cancelled' });
    },
    bg,
  );

  events.on(
    'activity.joined',
    ({ activityId, userId }) =>
      scheduler.schedule('activity-event', { activityId, kind: 'joined', userId }),
    bg,
  );

  // Un seul envoi par conversation et par personne dans la fenêtre de regroupement.
  events.on(
    'message.created',
    async ({ message, recipientIds }) => {
      if (message.type !== 'text') return;
      const runAt = new Date(now().getTime() + MESSAGE_PUSH_DELAY_MS);
      for (const userId of recipientIds) {
        if (userId === message.sender?.id) continue;
        await scheduler.schedule(
          'message-push',
          { conversationId: message.conversationId, userId },
          { runAt, jobId: jobIds.messages(message.conversationId, userId) },
        );
      }
    },
    bg,
  );
}
