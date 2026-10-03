import { LegalScreen } from '@/features/settings/screens/LegalScreen';

export default function PrivacyRoute() {
  return <LegalScreen document="privacy" />;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
