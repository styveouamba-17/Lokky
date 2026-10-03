import { useLocalSearchParams } from 'expo-router';
import { CodeScreen } from '@/features/auth/screens/CodeScreen';

export default function CodeRoute() {
  const { email } = useLocalSearchParams<{ email: string }>();
  return <CodeScreen email={email ?? ''} />;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
