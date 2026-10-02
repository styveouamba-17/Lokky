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
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export function createHttpClient({
  baseUrl,
  getAccessToken,
  fetchFn = fetch,
  timeoutMs = 15_000,
}: HttpClientOptions): ApiClient {
  async function request<R extends RouteName>(
    name: R,
    input: RouteInput<R>,
  ): Promise<RouteOutput<R>> {
    const def = routes[name];
    // Valider avant l'envoi : détecte les bugs côté app et applique les normalisations (trim…).
    const parsed = def.input.parse(input) as Record<string, unknown>;
    const req = buildRequest(def, parsed);
    const url = `${baseUrl}${req.path}${req.query ? `?${toQueryString(req.query)}` : ''}`;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (req.body) headers['Content-Type'] = 'application/json';
    if (def.auth) {
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetchFn(url, {
        method: req.method,
        headers,
        body: req.body ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw controller.signal.aborted
        ? new ApiError('timeout', 'La requête a pris trop de temps.')
        : new ApiError('network', 'Connexion impossible.');
    } finally {
      clearTimeout(timer);
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
