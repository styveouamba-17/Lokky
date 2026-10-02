export type AppEnv = { apiMode: 'mock'; apiUrl: null } | { apiMode: 'http'; apiUrl: string };

export function parseEnv(raw: { apiMode?: string; apiUrl?: string }, isDev: boolean): AppEnv {
  const mode = raw.apiMode ?? (isDev ? 'mock' : undefined);
  if (mode !== 'mock' && mode !== 'http') {
    throw new Error(
      `EXPO_PUBLIC_API_MODE invalide : « ${String(raw.apiMode)} » (attendu : mock ou http).`,
    );
  }
  if (mode === 'mock') return { apiMode: 'mock', apiUrl: null };

  const url = raw.apiUrl?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error('EXPO_PUBLIC_API_URL doit être une URL http(s) en mode http.');
  }
  return { apiMode: 'http', apiUrl: url.replace(/\/+$/, '') };
}

// Accès direct obligatoire : Expo n'injecte que les `process.env.EXPO_PUBLIC_*` écrits en toutes lettres.
export const env = parseEnv(
  { apiMode: process.env.EXPO_PUBLIC_API_MODE, apiUrl: process.env.EXPO_PUBLIC_API_URL },
  __DEV__,
);
