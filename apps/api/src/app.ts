import helmet from '@fastify/helmet';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import { sql } from 'drizzle-orm';
import type { Database } from './db/client';
import { createEventBus, type EventBus } from './events';
import type { Services } from './services';
import type { Handlers } from './http/context';
import { errorBody, HttpError } from './http/errors';
import { createRedisRateLimiter, type RateLimiter } from './http/rateLimit';
import { registerRoutes } from './http/registerRoutes';
import { registerChatListeners } from './modules/chat/handlers';
import { assertCanWrite, isWriteGuarded } from './modules/users/moderation';
import { isActiveAccount } from './modules/users/users';
import { handlers as defaultHandlers } from './modules/handlers';

export interface AppDeps {
  db: Database;
  redis: Redis;
  services: Services;
  events?: EventBus;
  logLevel?: string;
  handlers?: Handlers;
  now?: () => Date;
  authenticate?: (token: string) => Promise<string | null>;
  strictOutput?: boolean;
  // Par défaut, limitation de débit sur Redis ; null pour la désactiver (tests).
  rateLimiter?: RateLimiter | null;
  // Derrière Caddy : l'adresse IP réelle vient de X-Forwarded-For.
  trustProxy?: boolean;
}

// Construit l'app sans l'écouter : main.ts la démarre, les tests l'appellent avec app.inject.
export async function buildApp({
  db,
  redis,
  services,
  events,
  logLevel = 'info',
  handlers = defaultHandlers,
  now = () => new Date(),
  authenticate,
  strictOutput = true,
  rateLimiter,
  trustProxy = false,
}: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    trustProxy,
    logger: {
      level: logLevel,
      // Jamais de jeton, de corps ni de paramètres de requête dans les journaux : la recherche
      // de Découvrir contient la position (lat, lng), qu'on ne conserve pas (confidentialité).
      redact: ['req.headers.authorization'],
      serializers: {
        req: (req: { method: string; url: string; id: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url.split('?')[0],
        }),
      },
    },
  });

  await app.register(helmet);

  app.setErrorHandler((error, req, reply) => {
    if (error instanceof HttpError) {
      if (error.status >= 500) req.log.error(error);
      return reply.status(error.status).send(errorBody(error.code, error.message));
    }
    // JSON mal formé, corps trop gros… : erreurs de Fastify côté client.
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.status(status).send(errorBody('validation', 'Requête invalide.'));
    }
    req.log.error(error);
    return reply.status(500).send(errorBody('internal', 'Erreur interne.'));
  });

  app.setNotFoundHandler((_req, reply) =>
    reply.status(404).send(errorBody('not_found', 'Route inconnue.')),
  );

  // Santé du service (surveillance externe, déploiement) : base et Redis joignables.
  app.get('/health', async (_req, reply) => {
    const [database, cache] = await Promise.all([
      db.execute(sql`select 1`).then(
        () => 'up' as const,
        () => 'down' as const,
      ),
      redis.ping().then(
        () => 'up' as const,
        () => 'down' as const,
      ),
    ]);
    const ok = database === 'up' && cache === 'up';
    return reply.status(ok ? 200 : 503).send({ ok, database, cache });
  });

  // Bus d'événements de domaine : le chat, le temps réel et les push s'y abonneront.
  const bus = events ?? createEventBus((error) => app.log.error(error, 'Abonné en erreur'));
  registerChatListeners(bus, db);
  app.decorate('events', bus);

  registerRoutes(app, {
    db,
    services,
    events: bus,
    handlers,
    now,
    // Jeton valide ET compte encore actif : un compte supprimé perd l'accès tout de suite.
    authenticate:
      authenticate ??
      (async (token) => {
        const userId = await services.tokens.verify(token, now());
        return userId && (await isActiveAccount(db, userId)) ? userId : null;
      }),
    rateLimiter: rateLimiter === undefined ? createRedisRateLimiter(redis) : rateLimiter,
    strictOutput,
    guardWrite: async (route, method, viewerId) => {
      if (isWriteGuarded(route, method)) await assertCanWrite(db, viewerId, now());
    },
  });
  return app;
}
