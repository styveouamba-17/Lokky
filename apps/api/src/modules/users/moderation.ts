import type { ModerationStatus, RouteName } from '@lokky/shared';
import { eq } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { moderationEvents, users } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';

// Canal Redis des décisions de modération : le serveur temps réel prévient l'app
// (moderation:update), quel que soit le processus qui a pris la décision (script, admin).
export const MODERATION_CHANNEL = 'lokky:moderation';

export interface ModerationNotice {
  userId: string;
  status: ModerationStatus;
  suspendedUntil: string | null;
}

// Routes encore permises à un compte suspendu ou banni : partir, supprimer son compte.
const ALWAYS_ALLOWED: ReadonlySet<RouteName> = new Set([
  'auth.logout',
  'me.delete',
  'me.registerPushToken',
  'conversations.markRead',
]);

export const isWriteGuarded = (route: RouteName, method: string) =>
  method !== 'GET' && !ALWAYS_ALLOWED.has(route);

// Compte suspendu ou banni : plus d'écriture (spec backend §5). La lecture de /me reste
// possible : l'app affiche l'écran dédié. Une suspension échue est levée automatiquement.
export async function assertCanWrite(db: Database, userId: string, now: Date) {
  const [row] = await db
    .select({ status: users.moderationStatus, until: users.suspendedUntil })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return;
  if (row.status === 'banned') throw new HttpError('account_banned', 'Compte fermé.');
  if (row.status === 'suspended' && (!row.until || row.until > now)) {
    throw new HttpError('account_suspended', 'Compte suspendu.');
  }
}

export async function applyModeration(
  db: Database,
  {
    userId,
    status,
    until = null,
    reason = null,
    now = new Date(),
  }: {
    userId: string;
    status: ModerationStatus;
    until?: Date | null;
    reason?: string | null;
    now?: Date;
  },
): Promise<ModerationNotice> {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ moderationStatus: status, suspendedUntil: status === 'suspended' ? until : null })
      .where(eq(users.id, userId));
    await tx
      .insert(moderationEvents)
      .values({ id: uuidv7(now.getTime()), userId, status, until, reason, createdAt: now });
  });
  return {
    userId,
    status,
    suspendedUntil: status === 'suspended' && until ? until.toISOString() : null,
  };
}
