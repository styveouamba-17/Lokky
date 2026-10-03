import { useLocalSearchParams } from 'expo-router';
import { ActivityDetailScreen } from '@/features/activities/screens/ActivityDetailScreen';

export default function ActivityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ActivityDetailScreen id={id ?? ''} />;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
