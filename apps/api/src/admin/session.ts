import type { Staff } from '@lokky/shared/admin';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Database } from '../db/client';
import { adminSessions, users } from '../db/schema';
import { uuidv7 } from '../lib/ids';
import { randomToken, sha256 } from '../lib/secrets';

// Session de l'admin web : jeton opaque dans un cookie httpOnly, SameSite=Strict (le
// navigateur ne l'envoie jamais depuis un autre site), haché en base, 12 heures.
// L'admin est servi sur la même origine que son API (Caddy en production, Vite en local).
export const ADMIN_COOKIE = 'lokky_admin';
export const ADMIN_SESSION_HOURS = 12;
const HOUR_MS = 3_600_000;

// En-tête exigé sur toutes les routes /admin : un formulaire d'un autre site ne peut pas
// l'ajouter, et un fetch d'une autre origine déclencherait une vérification CORS refusée.
export const ADMIN_CSRF_HEADER = 'x-lokky-admin';

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function sessionCookie(token: string | null, secure: boolean): string {
  const attributes = [
    `${ADMIN_COOKIE}=${token ? encodeURIComponent(token) : ''}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${token ? ADMIN_SESSION_HOURS * 3600 : 0}`,
  ];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

export async function openAdminSession(db: Database, userId: string, now: Date) {
  const token = randomToken();
  await db.insert(adminSessions).values({
    id: uuidv7(now.getTime()),
    userId,
    tokenHash: sha256(token),
    expiresAt: new Date(now.getTime() + ADMIN_SESSION_HOURS * HOUR_MS),
    createdAt: now,
  });
  return token;
}

export async function closeAdminSession(db: Database, token: string, now: Date) {
  await db
    .update(adminSessions)
    .set({ revokedAt: now })
    .where(eq(adminSessions.tokenHash, sha256(token)));
}

// Membre de l'équipe derrière ce jeton, revérifié à chaque requête : un rôle retiré, un
// compte supprimé, suspendu ou banni perd l'accès tout de suite.
export async function staffForToken(db: Database, token: string, now: Date): Promise<Staff | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      role: users.staffRole,
      moderationStatus: users.moderationStatus,
      suspendedUntil: users.suspendedUntil,
    })
    .from(adminSessions)
    .innerJoin(users, eq(users.id, adminSessions.userId))
    .where(
      and(
        eq(adminSessions.tokenHash, sha256(token)),
        isNull(adminSessions.revokedAt),
        gt(adminSessions.expiresAt, now),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!row || !row.role || !canUseAdmin(row, now)) return null;
  return { id: row.id, email: row.email, firstName: row.firstName, role: row.role };
}

export function canUseAdmin(
  row: { moderationStatus: string; suspendedUntil: Date | null },
  now: Date,
): boolean {
  if (row.moderationStatus === 'banned') return false;
  if (row.moderationStatus === 'suspended' && (!row.suspendedUntil || row.suspendedUntil > now)) {
    return false;
  }
  return true;
}
