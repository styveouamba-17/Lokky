import { and, eq } from 'drizzle-orm';
import { authIdentities } from '../../db/schema';
import { viewer, type Handlers } from '../../http/context';
import { HttpError } from '../../http/errors';
import { uuidv7 } from '../../lib/ids';
import { trustOf } from '../trust/stats';
import { findOrCreateUserByEmail, findUser, meOrNull } from '../users/users';
import { consumeEmailCode, sendEmailCode } from './emailCodes';
import { closeSession, openSession, rotateSession } from './sessions';

// Connexion (spec backend §5) : code par email, Apple, Google. Un même email mène au même
// compte, quel que soit le moyen de connexion.
export const authHandlers: Handlers = {
  // Répond toujours ok : on ne révèle pas si un compte existe pour cet email.
  'auth.emailStart': async ({ email }, { db, services, now }) => {
    await sendEmailCode(db, services.mailer, email, now());
    return { ok: true as const };
  },

  'auth.emailVerify': async ({ email, code }, { db, services, now }) => {
    const n = now();
    await consumeEmailCode(db, email, code, n);
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
