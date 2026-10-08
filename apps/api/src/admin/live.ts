import { count, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { ServerResponse } from 'node:http';
import type { Redis } from 'ioredis';
import type { Database } from '../db/client';
import { reports } from '../db/schema';
import type { EventBus } from '../events';
import { ADMIN_COOKIE, readCookie, staffForToken } from './session';

// Admin en direct (Server-Sent Events, GET /admin/events) : le nombre de signalements à
// traiter arrive dès qu'il change. Les changements passent par Redis : un signalement créé
// sur un processus de l'API prévient les admins connectés à tous les autres.
export const ADMIN_LIVE_CHANNEL = 'lokky:admin';
// Commentaire régulier : garde la connexion ouverte à travers les proxys, et revérifie la
// session (rôle retiré, compte suspendu…).
export const HEARTBEAT_MS = 25_000;

interface Client {
  res: ServerResponse;
  token: string;
}

export function registerAdminLive(
  app: FastifyInstance,
  {
    db,
    redis,
    events,
    now,
    heartbeatMs = HEARTBEAT_MS,
  }: { db: Database; redis: Redis; events: EventBus; now: () => Date; heartbeatMs?: number },
) {
  const clients = new Set<Client>();
  const subscriber = redis.duplicate();

  const openReports = async () =>
    (await db.select({ n: count() }).from(reports).where(eq(reports.status, 'open')))[0]?.n ?? 0;
  const send = (client: Client, open: number) =>
    client.res.write(`event: reports\ndata: ${JSON.stringify({ open })}\n\n`);

  void subscriber.subscribe(ADMIN_LIVE_CHANNEL);
  subscriber.on('message', async () => {
    if (clients.size === 0) return;
    try {
      const open = await openReports();
      for (const client of clients) send(client, open);
    } catch (error) {
      app.log.error(error, 'Admin en direct : comptage impossible');
    }
  });

  events.on(
    'reports.changed',
    () => redis.publish(ADMIN_LIVE_CHANNEL, 'reports').then(() => undefined),
    {
      background: true,
    },
  );

  const heartbeat = setInterval(async () => {
    for (const client of clients) {
      if (await staffForToken(db, client.token, now())) client.res.write(': ping\n\n');
      else client.res.end();
    }
  }, heartbeatMs);
  heartbeat.unref();

  app.get('/admin/events', async (req, reply) => {
    const token = readCookie(req.headers.cookie, ADMIN_COOKIE);
    const staff = token ? await staffForToken(db, token, now()) : null;
    if (!token || !staff) {
      return reply
        .status(401)
        .send({ error: { code: 'unauthorized', message: 'Session expirée ou absente.' } });
    }
    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      // Pas de mise en tampon par un proxy : chaque évènement part tout de suite.
      'X-Accel-Buffering': 'no',
    });
    // Reconnexion automatique du navigateur après 5 s si la connexion tombe.
    res.write('retry: 5000\n\n');
    const client = { res, token };
    clients.add(client);
    req.raw.on('close', () => clients.delete(client));
    send(client, await openReports());
  });

  // Avant la fermeture du serveur : un flux ouvert l'empêcherait de s'arrêter.
  app.addHook('preClose', async () => {
    clearInterval(heartbeat);
    for (const client of clients) client.res.end();
    clients.clear();
    subscriber.disconnect();
  });
}
