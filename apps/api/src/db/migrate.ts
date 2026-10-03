import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDatabase } from './client';

// Dossier des migrations, que ce fichier tourne depuis src/db/ (tsx) ou dist/db/ (build) :
// les fichiers SQL restent dans src/db/migrations, copiés tels quels dans l'image Docker.
export const MIGRATIONS_FOLDER = fileURLToPath(
  new URL(
    import.meta.url.includes('/dist/') ? '../../src/db/migrations' : './migrations',
    import.meta.url,
  ),
);

export async function runMigrations(url: string) {
  const { db, close } = createDatabase(url, { max: 1 });
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await close();
  }
}

// Lancé directement (npm run db:migrate, ou avant le démarrage en production).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL manquante.');
  await runMigrations(url);
  console.log('Migrations appliquées.');
}
