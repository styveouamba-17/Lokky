import { useLocalSearchParams } from 'expo-router';
import { EditActivityScreen } from '@/features/activities/screens/EditActivityScreen';

export default function EditActivityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditActivityScreen id={id ?? ''} />;
}

export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
