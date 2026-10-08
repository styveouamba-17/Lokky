import { eq } from 'drizzle-orm';
import { Redis } from 'ioredis';
import { createDatabase } from '../src/db/client';
import { users } from '../src/db/schema';
import { createBullScheduler } from '../src/jobs/bullmq';
import { applyModeration, MODERATION_CHANNEL } from '../src/modules/users/moderation';

// Modération en ligne de commande, en attendant l'admin (spec backend §16) :
//   npm run moderate -- <email> <active|warned|suspended|banned> [jours] [motif…]
// La personne est prévenue tout de suite dans l'app (moderation:update) et par push (worker).

const [email, status, days, ...reasonWords] = process.argv.slice(2);
const STATUSES = ['active', 'warned', 'suspended', 'banned'] as const;
type Status = (typeof STATUSES)[number];

if (!email || !STATUSES.includes(status as Status)) {
  console.error(
    'Usage : npm run moderate -- <email> <active|warned|suspended|banned> [jours] [motif]',
  );
  process.exit(1);
}

const database = createDatabase(process.env.DATABASE_URL ?? '', { max: 1 });
const redis = new Redis(process.env.REDIS_URL ?? '');
const scheduler = createBullScheduler(process.env.REDIS_URL ?? '');
try {
  const [user] = await database.db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error(`Aucun compte pour ${email}.`);
  const until =
    status === 'suspended' && days ? new Date(Date.now() + Number(days) * 86_400_000) : null;
  const notice = await applyModeration(database.db, {
    userId: user.id,
    status: status as Status,
    until,
    reason: reasonWords.join(' ') || null,
  });
  await redis.publish(MODERATION_CHANNEL, JSON.stringify(notice));
  await scheduler.schedule('moderation-push', {
    userId: user.id,
    status: status as Status,
    suspendedUntil: notice.suspendedUntil,
  });
  console.log(`${email} : ${status}${until ? ` jusqu'au ${until.toISOString()}` : ''}.`);
} finally {
  await database.close();
  await scheduler.close();
  redis.disconnect();
}
