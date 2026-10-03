import { useLocalSearchParams } from 'expo-router';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';

export default function UserRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserProfileScreen id={id ?? ''} />;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
