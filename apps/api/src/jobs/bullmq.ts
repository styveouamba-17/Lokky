import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import type { Processors } from './processors';
import type { JobName, JobScheduler } from './types';

// File de tâches sur Redis (spec backend §10). Le serveur API planifie et exécute les tâches ;
// src/worker.ts reste disponible pour les déploiements avec un processus séparé.
export const QUEUE_NAME = 'lokky';

// BullMQ exige des connexions Redis sans limite de tentatives.
const connection = (url: string) => new Redis(url, { maxRetriesPerRequest: null });

export function createBullScheduler(redisUrl: string): JobScheduler & { close(): Promise<void> } {
  const queue = new Queue(QUEUE_NAME, { connection: connection(redisUrl) });
  return {
    async schedule(name, data, { runAt, jobId } = {}) {
      await queue.add(name, data, {
        jobId,
        delay: runAt ? Math.max(0, runAt.getTime() - Date.now()) : 0,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: true,
        removeOnFail: 500,
      });
    },
    async cancel(jobId) {
      await queue.remove(jobId);
    },
    close: () => queue.close(),
  };
}

export async function startWorker(redisUrl: string, processors: Processors) {
  // Tâches de nuit (heure de Dakar = UTC) : une seule planification, même avec plusieurs
  // workers.
  const queue = new Queue(QUEUE_NAME, { connection: connection(redisUrl) });
  await queue.upsertJobScheduler(
    'nightly-purge',
    { pattern: '0 3 * * *' },
    {
      name: 'purge-deleted-accounts',
      data: {},
    },
  );
  await queue.upsertJobScheduler(
    'nightly-cleanup',
    { pattern: '30 3 * * *' },
    {
      name: 'cleanup',
      data: {},
    },
  );

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const run = processors[job.name as JobName] as ((data: unknown) => Promise<void>) | undefined;
      if (!run) throw new Error(`Tâche inconnue : ${job.name}`);
      await run(job.data);
    },
    { connection: connection(redisUrl), concurrency: 5 },
  );
  return {
    worker,
    close: async () => {
      await worker.close();
      await queue.close();
    },
  };
}
