import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import { HttpError } from '../../http/errors';
import { consumeEmailCode, sendEmailCode } from '../../modules/auth/emailCodes';
import { staffOf, type AdminHandlers } from '../context';
import { canUseAdmin } from '../session';
import { audit } from '../views';

const findStaffByEmail = async (db: Parameters<typeof sendEmailCode>[0], email: string) => {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row && row.staffRole && !row.deletedAt ? row : null;
};

// Connexion à l'admin : même code par email que l'app, réservé aux membres de l'équipe.
export const adminAuthHandlers: AdminHandlers = {
  // Répond toujours ok : on ne révèle pas quelles adresses font partie de l'équipe.
  'admin.auth.start': async ({ email }, { db, services, now }) => {
    if (await findStaffByEmail(db, email)) await sendEmailCode(db, services.mailer, email, now());
    return { ok: true as const };
  },

  'admin.auth.verify': async ({ email, code }, ctx) => {
    const n = ctx.now();
    const staff = await findStaffByEmail(ctx.db, email);
    if (!staff) throw new HttpError('validation', 'Code incorrect ou expiré.');
    await consumeEmailCode(ctx.db, email, code, n);
    if (!canUseAdmin(staff, n)) throw new HttpError('forbidden', 'Accès refusé.');
    await ctx.session.open(staff.id);
    await audit(ctx.db, {
      actorId: staff.id,
      action: 'session.open',
      targetType: 'staff',
      targetId: staff.id,
      now: n,
    });
    return { id: staff.id, email: staff.email, firstName: staff.firstName, role: staff.staffRole! };
  },

  'admin.auth.logout': async (_input, ctx) => {
    await ctx.session.close();
    return { ok: true as const };
  },

  'admin.me': (_input, ctx) => staffOf(ctx),
};
