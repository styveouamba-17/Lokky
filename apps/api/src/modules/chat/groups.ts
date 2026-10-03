import { and, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { conversationMembers, conversations } from '../../db/schema';
import { uuidv7 } from '../../lib/ids';

// Groupes de discussion des sorties (spec app §6.3, règle 1) : fonctions du module chat
// utilisées par le module activities, dans ses transactions.

// Une transaction Drizzle offre les mêmes méthodes de requête que la base.
export type Tx = Pick<Database, 'insert' | 'delete' | 'select' | 'update' | 'execute'>;

export async function createGroup(tx: Tx, activityId: string, creatorId: string, now: Date) {
  const id = uuidv7(now.getTime());
  await tx.insert(conversations).values({ id, type: 'group', activityId, createdAt: now });
  await tx
    .insert(conversationMembers)
    .values({ conversationId: id, userId: creatorId, joinedAt: now, lastReadAt: now });
  return id;
}

export async function groupIdOf(tx: Tx, activityId: string): Promise<string | null> {
  const [row] = await tx
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.activityId, activityId))
    .limit(1);
  return row?.id ?? null;
}

export async function addGroupMember(tx: Tx, activityId: string, userId: string, now: Date) {
  const id = await groupIdOf(tx, activityId);
  if (!id) return;
  await tx
    .insert(conversationMembers)
    .values({ conversationId: id, userId, joinedAt: now, lastReadAt: now })
    .onConflictDoNothing();
}

export async function removeGroupMember(tx: Tx, activityId: string, userId: string) {
  const id = await groupIdOf(tx, activityId);
  if (!id) return;
  await tx
    .delete(conversationMembers)
    .where(and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, userId)));
}

export async function groupIdsFor(
  db: Database,
  activityIds: readonly string[],
): Promise<Map<string, string>> {
  if (activityIds.length === 0) return new Map();
  const rows = await db
    .select({ id: conversations.id, activityId: conversations.activityId })
    .from(conversations)
    .where(inArray(conversations.activityId, [...activityIds]));
  return new Map(rows.flatMap((r) => (r.activityId ? [[r.activityId, r.id] as const] : [])));
}
