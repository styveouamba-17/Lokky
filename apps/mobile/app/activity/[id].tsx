import { useLocalSearchParams } from 'expo-router';
import { ActivityDetailScreen } from '@/features/activities/screens/ActivityDetailScreen';

export default function ActivityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ActivityDetailScreen id={id ?? ''} />;
}
