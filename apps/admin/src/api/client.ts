import { buildRequest, toQueryString } from '@lokky/shared';
import {
  adminRoutes,
  type AdminRouteInput,
  type AdminRouteName,
  type AdminRouteOutput,
} from '@lokky/shared/admin';

// Client de l'API admin : même origine (/api), session par cookie httpOnly, en-tête
// anti-CSRF exigé par le serveur. Les réponses sont validées par le contrat partagé.
export const API_BASE = '/api';

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
      credentials: 'same-origin',
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
