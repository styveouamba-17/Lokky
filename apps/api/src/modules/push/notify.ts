import type { PushData } from '@lokky/shared';
import { inArray } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { pushTokens, users } from '../../db/schema';
import type { PushSender } from '../../services/push';
import { DEFAULT_PREFERENCES } from '../users/users';

// Familles de notifications, réglables par chacun (Réglages › Notifications de l'app).
// account : décisions sur le compte (modération), toujours envoyées, jamais désactivables.
export type PushKind = 'messages' | 'activityUpdates' | 'reminders' | 'account';

export interface Notification {
  userId: string;
  title: string;
  body: string;
  data: PushData;
}

// Envoie à chaque personne sur tous ses téléphones, si elle a laissé ce type de
// notification activé et que son compte existe toujours. Les jetons morts sont supprimés.
export async function notify(
  db: Database,
  push: PushSender,
  kind: PushKind,
  notifications: readonly Notification[],
): Promise<number> {
  if (notifications.length === 0) return 0;
  const userIds = [...new Set(notifications.map((n) => n.userId))];
  const people = await db
    .select({ id: users.id, preferences: users.preferences, deletedAt: users.deletedAt })
    .from(users)
    .where(inArray(users.id, userIds));
  const allowed = new Set(
    people
      .filter(
        (p) =>
          !p.deletedAt &&
          (kind === 'account' || (p.preferences ?? DEFAULT_PREFERENCES).notifications[kind]),
      )
      .map((p) => p.id),
  );
  if (allowed.size === 0) return 0;

  const tokens = await db
    .select({ token: pushTokens.token, userId: pushTokens.userId })
    .from(pushTokens)
    .where(inArray(pushTokens.userId, [...allowed]));
  const messages = notifications
    .filter((n) => allowed.has(n.userId))
    .flatMap((n) =>
      tokens
        .filter((t) => t.userId === n.userId)
        .map((t) => ({ to: t.token, title: n.title, body: n.body, data: n.data })),
    );
  if (messages.length === 0) return 0;

  const { invalidTokens } = await push.send(messages);
  if (invalidTokens.length) {
    await db.delete(pushTokens).where(inArray(pushTokens.token, invalidTokens));
  }
  return messages.length;
}
