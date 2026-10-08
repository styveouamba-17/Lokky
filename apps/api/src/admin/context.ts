import type {
  AdminRouteName,
  AdminRouteOutput,
  AdminRouteParsedInput,
  Staff,
} from '@lokky/shared/admin';
import type { FastifyBaseLogger } from 'fastify';
import type { Database } from '../db/client';
import type { EventBus } from '../events';
import { HttpError } from '../http/errors';
import type { ModerationNotice } from '../modules/users/moderation';
import type { Services } from '../services';

// Ce que reçoit un handler de l'admin, en plus de son entrée validée.
export interface AdminContext {
  db: Database;
  services: Services;
  events: EventBus;
  now: () => Date;
  log: FastifyBaseLogger;
  // null seulement pour les routes de connexion.
  staff: Staff | null;
  // Prévient l'app de la personne (moderation:update), via Redis.
  publishModeration: (notice: ModerationNotice) => Promise<void>;
  // Cookie de session de l'admin.
  session: { open: (userId: string) => Promise<void>; close: () => Promise<void> };
}

export type AdminHandler<R extends AdminRouteName> = (
  input: AdminRouteParsedInput<R>,
  ctx: AdminContext,
) => AdminRouteOutput<R> | Promise<AdminRouteOutput<R>>;

export type AdminHandlers = { [R in AdminRouteName]?: AdminHandler<R> };

export function staffOf(ctx: AdminContext): Staff {
  if (!ctx.staff) throw new HttpError('unauthorized', 'Connexion requise.');
  return ctx.staff;
}
