import { LegalScreen } from '@/features/settings/screens/LegalScreen';

export default function TermsRoute() {
  return <LegalScreen document="terms" />;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
