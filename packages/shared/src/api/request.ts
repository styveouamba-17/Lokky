export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Scalar = string | number | boolean;
export type QueryValue = Scalar | Scalar[];

export interface BuiltRequest {
  method: HttpMethod;
  path: string;
  query: Record<string, QueryValue> | null;
  body: Record<string, unknown> | null;
}

const PARAM = /:([A-Za-z]\w*)/g;

export function pathParams(path: string): string[] {
  return [...path.matchAll(PARAM)].map((m) => m[1] ?? '');
}

const isScalar = (v: unknown): v is Scalar =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const isQueryValue = (v: unknown): v is QueryValue =>
  isScalar(v) || (Array.isArray(v) && v.every(isScalar));

export function buildRequest(
  def: { method: HttpMethod; path: string },
  input: Record<string, unknown>,
): BuiltRequest {
  const rest: Record<string, unknown> = { ...input };
  const path = def.path.replace(PARAM, (_match, name: string) => {
    const value = rest[name];
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Paramètre de chemin manquant : ${name}`);
    }
    delete rest[name];
    return encodeURIComponent(value);
  });

  const entries = Object.entries(rest).filter(([, v]) => v !== undefined);
  if (def.method === 'GET' || def.method === 'DELETE') {
    if (entries.length === 0) return { method: def.method, path, query: null, body: null };
    const query: Record<string, QueryValue> = {};
    for (const [key, value] of entries) {
      if (!isQueryValue(value)) throw new Error(`Valeur de requête non sérialisable : ${key}`);
      query[key] = value;
    }
    return { method: def.method, path, query, body: null };
  }
  return { method: def.method, path, query: null, body: Object.fromEntries(entries) };
}

// Écrit à la main : URLSearchParams est incomplet dans React Native.
export function toQueryString(query: Record<string, QueryValue>): string {
  const pair = (k: string, v: Scalar) =>
    `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
  return Object.entries(query)
    .flatMap(([k, v]) => (Array.isArray(v) ? v.map((item) => pair(k, item)) : [pair(k, v)]))
    .join('&');
}
