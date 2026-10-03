import type { AuthTokens } from '@lokky/shared';
import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { sessions } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';
import { randomToken, sha256 } from '../../lib/secrets';
import { ACCESS_TOKEN_TTL_SECONDS, type AccessTokens } from '../../services/accessTokens';

// Sessions (spec backend §5) : jeton d'accès de 15 min + refresh token de 30 jours, haché en
// base et renouvelé à chaque usage. Une connexion = une famille de refresh tokens.
export const REFRESH_TOKEN_TTL_DAYS = 30;
const DAY_MS = 86_400_000;

export async function openSession(
  db: Database,
  tokens: AccessTokens,
  userId: string,
  now: Date,
  familyId: string = uuidv7(now.getTime()),
): Promise<AuthTokens> {
  const refreshToken = randomToken();
  await db.insert(sessions).values({
    id: uuidv7(now.getTime()),
    userId,
    familyId,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    createdAt: now,
  });
  return {
    accessToken: await tokens.sign(userId, familyId, now),
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

const revokeFamily = (db: Database, familyId: string, now: Date) =>
  db
    .update(sessions)
    .set({ revokedAt: now })
    .where(and(eq(sessions.familyId, familyId), isNull(sessions.revokedAt)));

// Échange un refresh token contre une nouvelle paire. Un jeton déjà échangé qui revient
// signale un vol probable : toute la connexion est coupée.
export async function rotateSession(
  db: Database,
  tokens: AccessTokens,
  refreshToken: string,
  now: Date,
): Promise<AuthTokens> {
  const outcome = await db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, sha256(refreshToken)))
      .for('update')
      .limit(1);
    if (!session) return { ok: false as const };
    if (session.revokedAt) {
      await revokeFamily(tx as unknown as Database, session.familyId, now);
      return { ok: false as const };
    }
    if (session.expiresAt <= now) return { ok: false as const };
    await tx.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, session.id));
    return { ok: true as const, userId: session.userId, familyId: session.familyId };
  });
  if (!outcome.ok) throw new HttpError('unauthorized', 'Session expirée.');
  return openSession(db, tokens, outcome.userId, now, outcome.familyId);
}

// Déconnexion : la connexion (toute la famille) est révoquée. Un jeton inconnu est ignoré.
export async function closeSession(db: Database, refreshToken: string, now: Date) {
  const [session] = await db
    .select({ familyId: sessions.familyId })
    .from(sessions)
    .where(eq(sessions.tokenHash, sha256(refreshToken)))
    .limit(1);
  if (session) await revokeFamily(db, session.familyId, now);
}
