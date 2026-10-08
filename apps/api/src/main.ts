import { Redis } from 'ioredis';
import { buildApp } from './app';
import { loadConfig } from './config';
import { createDatabase } from './db/client';
import { createBullScheduler, startWorker } from './jobs/bullmq';
import { registerJobListeners } from './jobs/listeners';
import { createProcessors } from './jobs/processors';
import { attachRealtime } from './realtime';
import { createServices } from './services';
import { createExpoPushSender } from './services/push';

const config = loadConfig();
const database = createDatabase(config.DATABASE_URL, { max: config.DB_POOL_SIZE });
const redis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: 3 });

const services = await createServices(config);

const app = await buildApp({
  db: database.db,
  redis,
  services,
  logLevel: config.LOG_LEVEL,
  strictOutput: config.NODE_ENV !== 'production',
  trustProxy: config.TRUST_PROXY,
  adminSecureCookie: config.NODE_ENV === 'production',
});

// Socket.IO partage le serveur HTTP de Fastify (même port).
const io = attachRealtime(app.server, {
  db: database.db,
  services,
  events: app.events,
  now: () => new Date(),
  redis,
});
// Tâches planifiées et worker dans le même processus, pour les déploiements sans service worker séparé.
const scheduler = createBullScheduler(config.REDIS_URL);
registerJobListeners(app.events, scheduler, database.db, () => new Date());
const { worker, close: closeWorker } = await startWorker(
  config.REDIS_URL,
  createProcessors({
    db: database.db,
    push: createExpoPushSender({ accessToken: config.EXPO_ACCESS_TOKEN }),
    now: () => new Date(),
  }),
);
worker.on('failed', (job, error) => {
  app.log.error({ job: job?.name, err: error }, "Echec du traitement d'une tache");
});
app.log.info('Worker des tâches démarré dans le processus API.');

app.addHook('onClose', async () => {
  await closeWorker();
  await io.close();
  await scheduler.close();
});

// Arrêt propre (déploiement, Ctrl+C) : on termine les requêtes en cours, puis on ferme tout.
const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'Arrêt du serveur');
  await app.close();
  await Promise.allSettled([database.close(), redis.quit()]);
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ port: config.PORT, host: '0.0.0.0' });
