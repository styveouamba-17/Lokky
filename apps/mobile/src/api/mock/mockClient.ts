import {
  routes,
  type RouteInput,
  type RouteName,
  type RouteOutput,
  type RouteParsedInput,
} from '@lokky/shared';
import { ApiError } from '../errors';
import type { ApiClient } from '../types';
import type { MockDb } from './db';
import { MOCK_VIEWER_ID } from './seed';

export interface MockContext {
  db: MockDb;
  now: () => Date;
  viewerId: string;
}

export type MockHandler<R extends RouteName> = (
  input: RouteParsedInput<R>,
  ctx: MockContext,
) => RouteOutput<R> | Promise<RouteOutput<R>>;

export type MockHandlers = { [R in RouteName]?: MockHandler<R> };

export interface MockClientOptions {
  handlers: MockHandlers;
  db: MockDb;
  viewerId?: string;
  now?: () => Date;
  latencyMs?: readonly [number, number];
  failureRate?: number;
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export function createMockClient({
  handlers,
  db,
  viewerId = MOCK_VIEWER_ID,
  now = () => new Date(),
  latencyMs = [200, 600],
  failureRate = 0,
  random = Math.random,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}: MockClientOptions): ApiClient {
  async function request<R extends RouteName>(
    name: R,
    input: RouteInput<R>,
  ): Promise<RouteOutput<R>> {
    const def = routes[name];
    const parsed = def.input.parse(input) as RouteParsedInput<R>;
    await sleep(latencyMs[0] + random() * (latencyMs[1] - latencyMs[0]));
    if (random() < failureRate) throw new ApiError('network', 'Erreur réseau simulée.');

    const handler = handlers[name] as MockHandler<R> | undefined;
    if (!handler) throw new ApiError('internal', `Route non simulée : ${name}`, 501);
    const result = await handler(parsed, { db, now, viewerId });
    // Garantit que les données simulées respectent le contrat, comme le ferait le vrai backend.
    return def.output.parse(result) as RouteOutput<R>;
  }

  return { request };
}
