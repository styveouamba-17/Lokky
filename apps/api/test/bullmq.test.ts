import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { afterAll, describe, expect, it } from 'vitest';
import { createBullScheduler, QUEUE_NAME, startWorker } from '../src/jobs/bullmq';
import type { Processors } from '../src/jobs/processors';
import type { JobName } from '../src/jobs/types';
import { TEST_REDIS_URL } from './env';

// La vraie file sur Redis : planifier, exécuter, annuler, ne pas doubler.
const calls: [JobName, unknown][] = [];
const record =
  (name: JobName) =>
  async (data: unknown): Promise<void> => {
    calls.push([name, data]);
  };
const processors = Object.fromEntries(
  (
    [
      'activity-reminder',
      'after-activity',
      'activity-event',
      'message-push',
      'purge-deleted-accounts',
      'cleanup',
    ] as JobName[]
  ).map((n) => [n, record(n)]),
) as unknown as Processors;

const scheduler = createBullScheduler(TEST_REDIS_URL);
const queue = new Queue(QUEUE_NAME, {
  connection: new Redis(TEST_REDIS_URL, { maxRetriesPerRequest: null }),
});

afterAll(async () => {
  await queue.obliterate({ force: true });
  await queue.close();
  await scheduler.close();
});

const waitFor = async (check: () => boolean, ms = 5000) => {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error('délai dépassé');
    await new Promise((r) => setTimeout(r, 50));
  }
};

describe('file BullMQ', () => {
  it('exécute une tâche, annule une tâche différée, ne double pas un même jobId', async () => {
    await queue.obliterate({ force: true });
    const worker = await startWorker(TEST_REDIS_URL, processors);
    try {
      await scheduler.schedule('activity-event', { activityId: 'a1', kind: 'joined' });
      await waitFor(() => calls.some(([n]) => n === 'activity-event'));

      const later = new Date(Date.now() + 60 * 60_000);
      await scheduler.schedule(
        'activity-reminder',
        { activityId: 'a2' },
        { runAt: later, jobId: 'reminder-a2' },
      );
      await scheduler.schedule(
        'activity-reminder',
        { activityId: 'a2' },
        { runAt: later, jobId: 'reminder-a2' },
      );
      // Les tâches de nuit ont aussi leur prochaine exécution en attente : on compte la nôtre.
      const reminders = async () =>
        (await queue.getDelayed()).filter((j) => j.name === 'activity-reminder').length;
      expect(await reminders()).toBe(1);
      await scheduler.cancel('reminder-a2');
      expect(await reminders()).toBe(0);

      // Les tâches de nuit sont planifiées une seule fois.
      const schedulers = await queue.getJobSchedulers();
      expect(schedulers.map((s) => s.key).sort()).toEqual(['nightly-cleanup', 'nightly-purge']);
    } finally {
      await worker.close();
    }
  });
});
