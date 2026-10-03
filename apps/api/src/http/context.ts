import type { RouteName, RouteOutput, RouteParsedInput } from '@lokky/shared';
import type { FastifyBaseLogger } from 'fastify';
import type { Database } from '../db/client';
import type { EventBus } from '../events';
import type { Services } from '../services';
import { HttpError } from './errors';

// Ce que chaque handler reçoit, en plus de son entrée validée. Même forme que les handlers du
// serveur simulé de l'app (apps/mobile/src/api/mock) : les deux implémentent le même contrat.
export interface HandlerContext {
  db: Database;
  services: Services;
  events: EventBus;
  now: () => Date;
  log: FastifyBaseLogger;
  // null seulement pour les routes publiques (connexion).
  viewerId: string | null;
}

export type Handler<R extends RouteName> = (
  input: RouteParsedInput<R>,
  ctx: HandlerContext,
) => RouteOutput<R> | Promise<RouteOutput<R>>;

export type Handlers = { [R in RouteName]?: Handler<R> };

// Dans une route authentifiée, le spectateur est garanti par registerRoutes.
export function viewer(ctx: HandlerContext): string {
  if (!ctx.viewerId) throw new HttpError('unauthorized', 'Connexion requise.');
  return ctx.viewerId;
}
