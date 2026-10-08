import { and, desc, eq, gt, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { emailCodes } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';
import { randomCode, sameHash, sha256 } from '../../lib/secrets';
import type { Mailer } from '../../services/mailer';

// Codes de connexion par email (spec backend §5), partagés par l'app et l'admin :
// 10 minutes, 5 essais, 1 envoi par minute et 5 par heure pour une même adresse.
export const CODE_TTL_MINUTES = 10;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_RESEND_SECONDS = 60;
export const CODES_PER_HOUR = 5;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

const codeHash = (email: string, code: string) => sha256(`${email}:${code}`);

export async function sendEmailCode(db: Database, mailer: Mailer, email: string, n: Date) {
  const [recent] = await db
    .select({ id: emailCodes.id })
    .from(emailCodes)
    .where(
      and(
        eq(emailCodes.email, email),
        gt(emailCodes.createdAt, new Date(n.getTime() - CODE_RESEND_SECONDS * 1000)),
      ),
    )
    .limit(1);
  if (recent) throw new HttpError('rate_limited', 'Attends une minute avant un nouveau code.');
  // Sans plafond horaire, on pourrait essayer ~7 000 codes par jour sur une même adresse.
  const [{ sent } = { sent: 0 }] = await db
    .select({ sent: sql<number>`count(*)`.mapWith(Number) })
    .from(emailCodes)
    .where(
      and(eq(emailCodes.email, email), gt(emailCodes.createdAt, new Date(n.getTime() - HOUR_MS))),
    );
  if (sent >= CODES_PER_HOUR) {
    throw new HttpError('rate_limited', 'Trop de codes demandés. Réessaie dans une heure.');
  }

  const code = randomCode();
  await db.insert(emailCodes).values({
    id: uuidv7(n.getTime()),
    email,
    codeHash: codeHash(email, code),
    expiresAt: new Date(n.getTime() + CODE_TTL_MINUTES * MINUTE_MS),
    createdAt: n,
  });
  await mailer.sendLoginCode(email, code);
}

// Vérifie le code ; une fois utilisé, tous les codes de cet email deviennent inutilisables.
export async function consumeEmailCode(db: Database, email: string, code: string, n: Date) {
  const [latest] = await db
    .select()
    .from(emailCodes)
    .where(and(eq(emailCodes.email, email), gt(emailCodes.expiresAt, n)))
    .orderBy(desc(emailCodes.createdAt))
    .limit(1);
  if (!latest) throw new HttpError('validation', 'Code incorrect ou expiré.');
  if (latest.attempts >= CODE_MAX_ATTEMPTS) {
    throw new HttpError('rate_limited', 'Trop d’essais. Demande un nouveau code.');
  }
  if (!sameHash(latest.codeHash, codeHash(email, code))) {
    await db
      .update(emailCodes)
      .set({ attempts: sql`${emailCodes.attempts} + 1` })
      .where(eq(emailCodes.id, latest.id));
    throw new HttpError('validation', 'Code incorrect.');
  }
  await db.delete(emailCodes).where(eq(emailCodes.email, email));
}
