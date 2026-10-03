import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { authIdentities, emailCodes } from '../../db/schema';
import { viewer, type Handlers } from '../../http/context';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';
import { randomCode, sameHash, sha256 } from '../../lib/secrets';
import { trustOf } from '../trust/stats';
import { findOrCreateUserByEmail, findUser, meOrNull } from '../users/users';
import { closeSession, openSession, rotateSession } from './sessions';

// Connexion (spec backend §5) : code par email, Apple, Google. Un même email mène au même
// compte, quel que soit le moyen de connexion.
export const CODE_TTL_MINUTES = 10;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_RESEND_SECONDS = 60;
export const CODES_PER_HOUR = 5;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

const codeHash = (email: string, code: string) => sha256(`${email}:${code}`);

export const authHandlers: Handlers = {
  // Répond toujours ok : on ne révèle pas si un compte existe pour cet email.
  'auth.emailStart': async ({ email }, { db, services, now }) => {
    const n = now();
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
    await services.mailer.sendLoginCode(email, code);
    return { ok: true as const };
  },

  'auth.emailVerify': async ({ email, code }, { db, services, now }) => {
    const n = now();
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
    // Code utilisé : tous les codes de cet email deviennent inutilisables.
    await db.delete(emailCodes).where(eq(emailCodes.email, email));

    const user = await findOrCreateUserByEmail(db, email, n);
    return {
      tokens: await openSession(db, services.tokens, user.id, n),
      user: meOrNull(user, await trustOf(db, user.id, n)),
    };
  },

  'auth.oauth': async ({ provider, idToken }, { db, services, now }) => {
    const n = now();
    const identity = await services.verifyIdToken(provider, idToken);
    if (!identity) throw new HttpError('unauthorized', 'Connexion refusée par le fournisseur.');

    const [linked] = await db
      .select({ userId: authIdentities.userId })
      .from(authIdentities)
      .where(
        and(eq(authIdentities.provider, provider), eq(authIdentities.subject, identity.subject)),
      )
      .limit(1);

    let user = linked ? await findUser(db, linked.userId) : null;
    if (!user) {
      // Première connexion avec ce compte Apple ou Google : rattachement par email vérifié.
      if (!identity.email || !identity.emailVerified) {
        throw new HttpError('validation', 'Email non vérifié chez le fournisseur.');
      }
      user = await findOrCreateUserByEmail(db, identity.email.toLowerCase(), n);
      await db
        .insert(authIdentities)
        .values({
          id: uuidv7(n.getTime()),
          userId: user.id,
          provider,
          subject: identity.subject,
          createdAt: n,
        })
        .onConflictDoNothing();
    }
    return {
      tokens: await openSession(db, services.tokens, user.id, n),
      user: meOrNull(user, await trustOf(db, user.id, n)),
    };
  },

  'auth.refresh': ({ refreshToken }, { db, services, now }) =>
    rotateSession(db, services.tokens, refreshToken, now()),

  'auth.logout': async ({ refreshToken }, ctx) => {
    viewer(ctx);
    await closeSession(ctx.db, refreshToken, ctx.now());
    return { ok: true as const };
  },
};
