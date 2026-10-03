import { and, eq, or } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { blocks } from '../../db/schema';

// Blocages (spec app §6.3, règle 6) : fonctions utilisées par les autres modules. Un blocage,
// dans un sens ou dans l'autre, coupe tout entre les deux personnes.

export async function hasBlocked(db: Database, blockerId: string, blockedId: string) {
  const [row] = await db
    .select({ id: blocks.blockerId })
    .from(blocks)
    .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)))
    .limit(1);
  return Boolean(row);
}

export async function isBlockedEitherWay(db: Database, a: string, b: string) {
  const [row] = await db
    .select({ id: blocks.blockerId })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, a), eq(blocks.blockedId, b)),
        and(eq(blocks.blockerId, b), eq(blocks.blockedId, a)),
      ),
    )
    .limit(1);
  return Boolean(row);
}

// Toutes les personnes avec qui le lien est coupé, dans les deux sens.
export async function cutOffIds(db: Database, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(or(eq(blocks.blockerId, userId), eq(blocks.blockedId, userId)));
  return new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)));
}
