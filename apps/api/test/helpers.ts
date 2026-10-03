import { sql } from 'drizzle-orm';
import { Redis } from 'ioredis';
import { buildApp, type AppDeps } from '../src/app';
import { createDatabase } from '../src/db/client';
import { TEST_DATABASE_URL, TEST_REDIS_URL } from './env';
import { createTestServices } from './services';

// App complète sur la vraie base de test, sans journaux. À fermer avec close() après le test.
export async function createTestApp(
  overrides: Partial<Omit<AppDeps, 'db' | 'redis' | 'services'>> = {},
) {
  const database = createDatabase(TEST_DATABASE_URL, { max: 2 });
  const redis = new Redis(TEST_REDIS_URL, { maxRetriesPerRequest: 1 });
  const fakes = await createTestServices();
  const app = await buildApp({
    db: database.db,
    redis,
    services: fakes.services,
    logLevel: 'silent',
    rateLimiter: null,
    ...overrides,
  });
  return {
    app,
    db: database.db,
    // Horloge de l'app de test : les fabriques signent leurs jetons à cette heure-là.
    now: overrides.now ?? (() => new Date()),
    ...fakes,
    async close() {
      await app.close();
      await Promise.allSettled([database.close(), redis.quit()]);
    },
  };
}

// Vide les tables de l'app entre deux tests (l'ordre des clés étrangères est géré par CASCADE).
// Jamais les tables système : migrations, et spatial_ref_sys de PostGIS (projections).
export async function resetDatabase(db: Awaited<ReturnType<typeof createTestApp>>['db']) {
  await db.execute(sql`
    do $$ declare t text;
    begin
      for t in select tablename from pg_tables
        where schemaname = 'public' and tablename not in ('__drizzle_migrations', 'spatial_ref_sys')
      loop execute format('truncate table %I cascade', t); end loop;
    end $$;
  `);
}
