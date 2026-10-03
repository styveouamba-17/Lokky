import { Redirect } from 'expo-router';
import { DesignSystemScreen } from '@/features/dev/screens/DesignSystemScreen';

export default function DevUiRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DesignSystemScreen />;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
