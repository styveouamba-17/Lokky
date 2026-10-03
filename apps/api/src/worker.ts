import { loadConfig } from './config';
import { createDatabase } from './db/client';
import { startWorker } from './jobs/bullmq';
import { createProcessors } from './jobs/processors';
import { createExpoPushSender } from './services/push';

// Processus des tâches planifiées (rappels, après-sortie, push, purges), lancé à côté de
// l'API : même image Docker, autre commande (spec backend §13).
const config = loadConfig();
const database = createDatabase(config.DATABASE_URL, { max: 5 });
const processors = createProcessors({
  db: database.db,
  push: createExpoPushSender({ accessToken: config.EXPO_ACCESS_TOKEN }),
  now: () => new Date(),
});
const { worker, close } = await startWorker(config.REDIS_URL, processors);

worker.on('failed', (job, error) => {
  console.error(`Tâche ${job?.name ?? '?'} en échec : ${error.message}`);
});
console.log('Worker des tâches démarré.');

const shutdown = async () => {
  await close();
  await database.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
