import type { AuthTokens } from '@lokky/shared';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { pushTokens, sessions } from '../../db/schema';
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

// Une connexion coupée n'envoie plus de notifications au téléphone qui l'utilisait.
async function revokeFamily(db: Database, familyId: string, now: Date) {
  await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(and(eq(sessions.familyId, familyId), isNull(sessions.revokedAt)));
  await db.delete(pushTokens).where(eq(pushTokens.sessionFamilyId, familyId));
}

// Connexion encore valable : au moins un refresh token ni révoqué ni expiré dans la famille.
export async function isSessionActive(db: Database, familyId: string, now: Date) {
  const [row] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(eq(sessions.familyId, familyId), isNull(sessions.revokedAt), gt(sessions.expiresAt, now)),
    )
    .limit(1);
  return Boolean(row);
}

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
    // Même transaction : la connexion n'est jamais vue sans jeton valable (temps réel).
    const next = await openSession(
      tx as unknown as Database,
      tokens,
      session.userId,
      now,
      session.familyId,
    );
    return { ok: true as const, tokens: next };
  });
  if (!outcome.ok) throw new HttpError('unauthorized', 'Session expirée.');
  return outcome.tokens;
}

// Déconnexion : la connexion (toute la famille) est révoquée. Un jeton inconnu est ignoré.
// Renvoie la famille révoquée (temps réel à couper), ou null.
export async function closeSession(
  db: Database,
  refreshToken: string,
  now: Date,
): Promise<string | null> {
  const [session] = await db
    .select({ familyId: sessions.familyId })
    .from(sessions)
    .where(eq(sessions.tokenHash, sha256(refreshToken)))
    .limit(1);
  if (!session) return null;
  await revokeFamily(db, session.familyId, now);
  return session.familyId;
}
