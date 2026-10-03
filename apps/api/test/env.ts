// Services de test : Docker Compose en local (ports décalés), services GitHub Actions en CI.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://lokky:lokky@localhost:5434/lokky_test';
export const TEST_REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:6380/1';
