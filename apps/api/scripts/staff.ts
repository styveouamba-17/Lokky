import { eq } from 'drizzle-orm';
import { createDatabase } from '../src/db/client';
import { adminSessions, users } from '../src/db/schema';
import { findOrCreateUserByEmail } from '../src/modules/users/users';

// Équipe de l'admin, en ligne de commande (jamais depuis l'API) :
//   npm run staff -- <email> <admin|moderator|none>
// Le compte est créé s'il n'existe pas encore. « none » retire l'accès et ferme ses sessions.

const [email, role] = process.argv.slice(2);
const ROLES = ['admin', 'moderator', 'none'] as const;

if (!email || !ROLES.includes(role as (typeof ROLES)[number])) {
  console.error('Usage : npm run staff -- <email> <admin|moderator|none>');
  process.exit(1);
}

const database = createDatabase(process.env.DATABASE_URL ?? '', { max: 1 });
try {
  const user = await findOrCreateUserByEmail(database.db, email.trim().toLowerCase(), new Date());
  const staffRole = role === 'none' ? null : (role as 'admin' | 'moderator');
  await database.db.update(users).set({ staffRole }).where(eq(users.id, user.id));
  if (!staffRole) {
    await database.db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(eq(adminSessions.userId, user.id));
  }
  console.log(`${user.email} : ${staffRole ?? 'plus d’accès à l’admin'}.`);
} finally {
  await database.close();
}
