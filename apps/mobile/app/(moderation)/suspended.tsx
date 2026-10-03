import { ModerationScreen } from '@/features/moderation/screens/ModerationScreen';

export default function SuspendedRoute() {
  return <ModerationScreen kind="suspended" />;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
