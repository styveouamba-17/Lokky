import { buildRequest, toQueryString } from '@lokky/shared';
import {
  adminRoutes,
  type AdminRouteInput,
  type AdminRouteName,
  type AdminRouteOutput,
} from '@lokky/shared/admin';

// En production, VITE_API_URL peut pointer directement vers le backend ; en local ou
// derrière Caddy, /api reste relatif et le proxy conserve une origine unique.
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
export const API_BASE = configuredApiUrl || '/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<R extends AdminRouteName>(
  name: R,
  input: AdminRouteInput<R>,
  fetcher: typeof fetch = fetch,
): Promise<AdminRouteOutput<R>> {
  const def = adminRoutes[name];
  const req = buildRequest(def, input as Record<string, unknown>);
  const query = req.query ? `?${toQueryString(req.query)}` : '';
  let res: Response;
  try {
    res = await fetcher(`${API_BASE}${req.path}${query}`, {
      method: req.method,
      credentials: 'include',
      headers: {
        'x-lokky-admin': '1',
        ...(req.body ? { 'content-type': 'application/json' } : {}),
      },
      body: req.body ? JSON.stringify(req.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', 'Serveur injoignable. Vérifie ta connexion.');
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (json as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'internal',
      error?.message ?? 'Erreur inattendue.',
    );
  }
  const parsed = def.output.safeParse(json);
  if (!parsed.success) throw new ApiError(500, 'contract', 'Réponse inattendue du serveur.');
  return parsed.data as AdminRouteOutput<R>;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Erreur inattendue.';
