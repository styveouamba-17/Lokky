import {
  apiErrorBodySchema,
  buildRequest,
  routes,
  toQueryString,
  type RouteInput,
  type RouteName,
  type RouteOutput,
} from '@lokky/shared';
import { ApiError } from './errors';
import type { ApiClient } from './types';

export interface HttpClientOptions {
  baseUrl: string;
  getAccessToken: () => string | null | Promise<string | null>;
  // Appelé sur un 401 d'une route authentifiée : renvoie un nouveau jeton, ou null si la
  // session est perdue. Doit être mutualisé (voir createSingleFlight).
  refreshAccessToken?: () => Promise<string | null>;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export function createHttpClient({
  baseUrl,
  getAccessToken,
  refreshAccessToken,
  fetchFn = fetch,
  timeoutMs = 15_000,
}: HttpClientOptions): ApiClient {
  async function send(
    url: string,
    method: string,
    body: unknown,
    token: string | null,
  ): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchFn(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw controller.signal.aborted
        ? new ApiError('timeout', 'La requête a pris trop de temps.')
        : new ApiError('network', 'Connexion impossible.');
    } finally {
      clearTimeout(timer);
    }
  }

  async function request<R extends RouteName>(
    name: R,
    input: RouteInput<R>,
  ): Promise<RouteOutput<R>> {
    const def = routes[name];
    // Valider avant l'envoi : détecte les bugs côté app et applique les normalisations (trim…).
    const parsed = def.input.parse(input) as Record<string, unknown>;
    const req = buildRequest(def, parsed);
    const url = `${baseUrl}${req.path}${req.query ? `?${toQueryString(req.query)}` : ''}`;

    let res = await send(url, req.method, req.body, def.auth ? await getAccessToken() : null);

    // Jeton expiré : un seul rafraîchissement, puis on rejoue la requête une fois (spec §7.2).
    if (res.status === 401 && def.auth && refreshAccessToken) {
      const fresh = await refreshAccessToken();
      if (!fresh) throw new ApiError('unauthorized', 'Session expirée.', 401);
      res = await send(url, req.method, req.body, fresh);
    }

    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const body = apiErrorBodySchema.safeParse(json);
      if (body.success)
        throw new ApiError(body.data.error.code, body.data.error.message, res.status);
      throw new ApiError('internal', `Erreur HTTP ${res.status}`, res.status);
    }

    const output = def.output.safeParse(json);
    if (!output.success) {
      throw new ApiError('invalid_response', `Réponse hors contrat pour ${name}`, res.status);
    }
    return output.data as RouteOutput<R>;
  }

  return { request };
}

// Une seule exécution à la fois : les appels concurrents partagent la même promesse.
export function createSingleFlight<T>(task: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= task().finally(() => {
      pending = null;
    });
    return pending;
  };
}
