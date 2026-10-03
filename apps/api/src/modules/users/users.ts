import type { Me, Preferences, TrustStats, User, UserPreview } from '@lokky/shared';
import { eq, inArray } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { users } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';

// Fonctions du module users utilisées par les autres modules (auth…) : ils ne lisent jamais
// la table users eux-mêmes (spec backend §4).

export type UserRow = typeof users.$inferSelect;

export const DEFAULT_PREFERENCES: Preferences = {
  language: 'fr',
  theme: 'system',
  notifications: { messages: true, activityUpdates: true, reminders: true },
};

export async function findUser(db: Database, id: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function findUsers(
  db: Database,
  ids: readonly string[],
): Promise<Map<string, UserRow>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const rows = await db.select().from(users).where(inArray(users.id, unique));
  return new Map(rows.map((row) => [row.id, row]));
}

// Retrouve le compte de cet email, ou le crée (sans profil : l'onboarding reste à faire).
// Sûr en cas d'appels simultanés : l'unicité de l'email tranche.
export async function findOrCreateUserByEmail(
  db: Database,
  email: string,
  now: Date,
): Promise<UserRow> {
  await db
    .insert(users)
    .values({ id: uuidv7(now.getTime()), email, createdAt: now })
    .onConflictDoNothing({ target: users.email });
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!row) throw new HttpError('internal', 'Compte introuvable après création.');
  return row;
}

export const isOnboarded = (row: UserRow) => row.onboardedAt !== null;

// Le compte existe et n'a pas été supprimé (vérifié à chaque requête authentifiée).
export async function isActiveAccount(db: Database, id: string): Promise<boolean> {
  const [row] = await db
    .select({ deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return Boolean(row) && row!.deletedAt === null;
}

// Aperçu public (bulles, participants) : prénom et photo seulement.
export const toUserPreview = (row: UserRow): UserPreview => ({
  id: row.id,
  firstName: row.firstName ?? 'Membre Lokky',
  avatarUrl: row.avatarUrl,
});

export function toPublicUser(row: UserRow, trust: TrustStats): User {
  if (!row.firstName || !row.status || !row.neighborhood) {
    throw new HttpError('not_found', 'Profil indisponible.');
  }
  return {
    id: row.id,
    firstName: row.firstName,
    avatarUrl: row.avatarUrl,
    status: row.status,
    neighborhood: row.neighborhood,
    interests: row.interests,
    trust,
  };
}

export function toMe(row: UserRow, trust: TrustStats): Me {
  if (!row.firstName || !row.birthDate || !row.status || !row.neighborhood) {
    throw new HttpError('onboarding_required', 'Profil à compléter.');
  }
  return {
    id: row.id,
    firstName: row.firstName,
    avatarUrl: row.avatarUrl,
    status: row.status,
    neighborhood: row.neighborhood,
    interests: row.interests,
    trust,
    email: row.email,
    birthDate: row.birthDate,
    preferences: row.preferences ?? DEFAULT_PREFERENCES,
    moderation: {
      status: row.moderationStatus,
      suspendedUntil: row.suspendedUntil?.toISOString() ?? null,
    },
  };
}

// Profil complet pour la session, ou null tant que l'onboarding n'est pas fait.
export const meOrNull = (row: UserRow, trust: TrustStats): Me | null =>
  isOnboarded(row) ? toMe(row, trust) : null;
