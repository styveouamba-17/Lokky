import { adminRoutes, type AdminRouteName } from '@lokky/shared/admin';
import { parseQuery, type RawQuery } from '@lokky/shared';
import type { FastifyInstance } from 'fastify';
import type { Database } from '../db/client';
import type { EventBus } from '../events';
import { HttpError } from '../http/errors';
import type { RateLimiter } from '../http/rateLimit';
import type { ModerationNotice } from '../modules/users/moderation';
import type { Services } from '../services';
import type { AdminHandler, AdminHandlers } from './context';
import {
  ADMIN_COOKIE,
  ADMIN_CSRF_HEADER,
  closeAdminSession,
  openAdminSession,
  readCookie,
  sessionCookie,
  staffForToken,
} from './session';

export interface AdminRouteDeps {
  db: Database;
  services: Services;
  events: EventBus;
  handlers: AdminHandlers;
  now: () => Date;
  publishModeration: (notice: ModerationNotice) => Promise<void>;
  rateLimiter: RateLimiter | null;
  strictOutput: boolean;
  // Cookie Secure (HTTPS) : toujours en production.
  secureCookie: boolean;
}

const MINUTE = 60;

// Connexion : par adresse IP. Le reste : par membre de l'équipe.
const AUTH_POLICIES: Partial<Record<AdminRouteName, { limit: number; windowSeconds: number }>> = {
  'admin.auth.start': { limit: 10, windowSeconds: 15 * MINUTE },
  'admin.auth.verify': { limit: 30, windowSeconds: 15 * MINUTE },
};
const STAFF_POLICY = { limit: 600, windowSeconds: MINUTE };

// Même principe que registerRoutes (contrat de l'app) pour le contrat de l'admin : entrée et
// sortie validées, session par cookie au lieu du jeton Bearer.
export function registerAdminRoutes(app: FastifyInstance, deps: AdminRouteDeps) {
  for (const name of Object.keys(adminRoutes) as AdminRouteName[]) {
    const def = adminRoutes[name];

    app.route({
      method: def.method,
      url: def.path,
      handler: async (req, reply) => {
        if (req.headers[ADMIN_CSRF_HEADER] !== '1') {
          throw new HttpError('forbidden', 'Requête refusée.');
        }
        const now = deps.now();
        const token = readCookie(req.headers.cookie, ADMIN_COOKIE);
        const staff = def.auth && token ? await staffForToken(deps.db, token, now) : null;
        if (def.auth && !staff) throw new HttpError('unauthorized', 'Session expirée ou absente.');
        if ('role' in def && def.role === 'admin' && staff?.role !== 'admin') {
          throw new HttpError('forbidden', 'Réservé aux administrateurs.');
        }

        if (deps.rateLimiter) {
          const policy = AUTH_POLICIES[name] ?? STAFF_POLICY;
          const who = staff ? `staff:${staff.id}` : `ip:${req.ip}`;
          const retryAfter = await deps.rateLimiter.hit(
            `rl:${name}:${who}`,
            policy.limit,
            policy.windowSeconds,
          );
          if (retryAfter !== null) {
            void reply.header('Retry-After', String(retryAfter));
            throw new HttpError('rate_limited', 'Trop de demandes. Réessaie dans un instant.');
          }
        }

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

        const handler = deps.handlers[name] as AdminHandler<typeof name> | undefined;
        if (!handler) throw new HttpError('internal', `Route pas encore disponible : ${name}`, 501);

        const result = await handler(input.data as never, {
          db: deps.db,
          services: deps.services,
          events: deps.events,
          now: deps.now,
          log: req.log,
          staff,
          publishModeration: deps.publishModeration,
          session: {
            open: async (userId) => {
              const opened = await openAdminSession(deps.db, userId, now);
              void reply.header('Set-Cookie', sessionCookie(opened, deps.secureCookie));
            },
            close: async () => {
              if (token) await closeAdminSession(deps.db, token, now);
              void reply.header('Set-Cookie', sessionCookie(null, deps.secureCookie));
            },
          },
        });

        // Les réponses de l'admin ne doivent jamais être mises en cache (données personnelles).
        void reply.header('Cache-Control', 'no-store');
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
