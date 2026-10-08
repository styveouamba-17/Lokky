import Constants from 'expo-constants';
import { API_URL } from './configurl';

// hybrid (développement uniquement) : vrai backend pour les routes qu'il connaît déjà,
// simulation pour le reste (src/api/hybridClient.ts).
export type AppEnv =
  { apiMode: 'mock'; apiUrl: null } | { apiMode: 'http' | 'hybrid'; apiUrl: string };

interface RawEnv {
  apiMode?: string;
  apiUrl?: string;
  apiPort?: string;
}

const DEFAULT_API_PORT = '3000';

// devHostUri : adresse du serveur Metro vue par le téléphone (« 192.168.1.48:8081 »), fournie
// par Expo en développement. Sans EXPO_PUBLIC_API_URL, l'API locale est jointe sur la même
// machine : pas d'adresse IP à écrire, et ça suit le réseau Wi-Fi du moment.
export function parseEnv(raw: RawEnv, isDev: boolean, devHostUri?: string | null): AppEnv {
  const mode = raw.apiMode ?? (isDev ? 'http' : undefined);
  if (mode !== 'mock' && mode !== 'http' && mode !== 'hybrid') {
    throw new Error(
      `EXPO_PUBLIC_API_MODE invalide : « ${String(raw.apiMode)} » (attendu : mock, http ou hybrid).`,
    );
  }
  if (mode === 'hybrid' && !isDev) {
    throw new Error('EXPO_PUBLIC_API_MODE=hybrid est réservé au développement.');
  }
  if (mode === 'mock') return { apiMode: 'mock', apiUrl: null };

  const explicit = raw.apiUrl?.trim();
  const devHost = isDev && devHostUri ? devHostUri.split(':')[0] : undefined;
  const url =
    explicit || (devHost ? `http://${devHost}:${raw.apiPort?.trim() || DEFAULT_API_PORT}` : '');
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error('EXPO_PUBLIC_API_URL doit être une URL http(s) en mode http.');
  }
  return { apiMode: mode, apiUrl: url.replace(/\/+$/, '') };
}

// Accès direct obligatoire : Expo n'injecte que les `process.env.EXPO_PUBLIC_*` écrits en toutes lettres.
export const env = parseEnv(
  {
    apiMode: process.env.EXPO_PUBLIC_API_MODE,
    apiUrl: API_URL,
    apiPort: process.env.EXPO_PUBLIC_API_PORT,
  },
  __DEV__,
  Constants.expoConfig?.hostUri,
);
