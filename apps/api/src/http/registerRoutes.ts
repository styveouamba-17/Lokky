import { parseQuery, routes, type RawQuery, type RouteName } from '@lokky/shared';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Database } from '../db/client';
import type { EventBus } from '../events';
import type { Services } from '../services';
import type { Handler, Handlers } from './context';
import { HttpError } from './errors';
import { policyFor, type RateLimiter } from './rateLimit';

export interface RouteDeps {
  db: Database;
  services: Services;
  events: EventBus;
  handlers: Handlers;
  now: () => Date;
  // Renvoie l'utilisateur du jeton d'accès, ou null s'il est absent, invalide ou expiré.
  authenticate: (token: string) => Promise<string | null>;
  // Une réponse hors contrat est une erreur de code : visible tout de suite hors production.
  strictOutput: boolean;
  // Refuse l'écriture à un compte suspendu ou banni (module users, modération).
  guardWrite?: (route: RouteName, method: string, viewerId: string) => Promise<void>;
  // Limitation de débit (null : désactivée, pour les tests et le test de charge).
  rateLimiter?: RateLimiter | null;
}

const bearer = (req: FastifyRequest) => {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
};

// Chaque route du contrat (@lokky/shared) devient une route Fastify : même méthode, même
// chemin, entrée et sortie validées par les schémas zod du contrat. Une route sans handler
// répond 501, pour avancer module par module (B2 à B6).
export function registerRoutes(app: FastifyInstance, deps: RouteDeps) {
  for (const name of Object.keys(routes) as RouteName[]) {
    const def = routes[name];

    app.route({
      method: def.method,
      url: def.path,
      handler: async (req, reply) => {
        const viewerId = def.auth ? await requireViewer(req, deps) : null;
        if (deps.rateLimiter) {
          const { policy, scope } = policyFor(name, viewerId);
          const who = scope === 'user' ? viewerId : req.ip;
          const retryAfter = await deps.rateLimiter.hit(
            `rl:${name}:${scope}:${who}`,
            policy.limit,
            policy.windowSeconds,
          );
          if (retryAfter !== null) {
            void reply.header('Retry-After', String(retryAfter));
            throw new HttpError('rate_limited', 'Trop de demandes. Réessaie dans un instant.');
          }
        }
        if (viewerId && deps.guardWrite) await deps.guardWrite(name, def.method, viewerId);

        const params = (req.params ?? {}) as Record<string, string>;
        const raw =
          def.method === 'GET' || def.method === 'DELETE'
            ? { ...parseQuery(def.input, (req.query ?? {}) as RawQuery), ...params }
            : { ...((req.body as Record<string, unknown> | undefined) ?? {}), ...params };
        const input = def.input.safeParse(raw);
        if (!input.success) {
          const first = input.error.issues[0];
          const where = first?.path.length ? `${first.path.join('.')} : ` : '';
          throw new HttpError('validation', `${where}${first?.message ?? 'Entrée invalide.'}`);
        }

        const handler = deps.handlers[name] as Handler<typeof name> | undefined;
        if (!handler) throw new HttpError('internal', `Route pas encore disponible : ${name}`, 501);

        const result = await handler(input.data as never, {
          db: deps.db,
          services: deps.services,
          events: deps.events,
          now: deps.now,
          log: req.log,
          viewerId,
        });

        const output = def.output.safeParse(result);
        if (!output.success) {
          req.log.error({ route: name, issues: output.error.issues }, 'Réponse hors contrat');
          if (deps.strictOutput) {
            throw new HttpError('internal', `Réponse hors contrat pour ${name}.`);
          }
          return reply.send(result);
        }
        return reply.send(output.data);
      },
    });
  }
}

async function requireViewer(req: FastifyRequest, deps: RouteDeps): Promise<string> {
  const token = bearer(req);
  const viewerId = token ? await deps.authenticate(token) : null;
  if (!viewerId) throw new HttpError('unauthorized', 'Session expirée ou absente.');
  return viewerId;
}
