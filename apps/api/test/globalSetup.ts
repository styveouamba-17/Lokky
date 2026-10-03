import { runMigrations } from '../src/db/migrate';
import { TEST_DATABASE_URL } from './env';

// Une fois avant tous les tests : la base de test reçoit les migrations à jour.
export default async function setup() {
  await runMigrations(TEST_DATABASE_URL);
}
