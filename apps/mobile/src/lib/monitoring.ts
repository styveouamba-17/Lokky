import * as Sentry from '@sentry/react-native';

// Suivi des plantages (spec §7.5). Actif seulement si un DSN est fourni
// (EXPO_PUBLIC_SENTRY_DSN, dans eas.json ou .env) : rien n'est envoyé en développement.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const monitoringEnabled = Boolean(DSN) && !__DEV__;

// Navigation : chaque écran devient une étape du suivi (expo-router s'appuie sur React Navigation).
export const navigationIntegration = Sentry.reactNavigationIntegration();

export function initMonitoring() {
  if (!monitoringEnabled) return;
  Sentry.init({
    dsn: DSN,
    // Pas de données personnelles (adresse IP, email…) dans les rapports.
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
    integrations: [navigationIntegration],
  });
}

export function reportError(error: unknown) {
  if (monitoringEnabled) Sentry.captureException(error);
}

export const wrapRoot = Sentry.wrap;
