import type { ReportInput } from '@lokky/shared';
import { useLocalSearchParams } from 'expo-router';
import { ReportScreen } from '@/features/moderation/screens/ReportScreen';

const TARGETS: readonly ReportInput['targetType'][] = ['user', 'activity', 'message'];

// /report?targetType=user&targetId=u_moussa
export default function ReportRoute() {
  const { targetType, targetId } = useLocalSearchParams<{
    targetType: string;
    targetId: string;
  }>();
  const target = TARGETS.find((t) => t === targetType) ?? 'user';
  return <ReportScreen targetType={target} targetId={targetId ?? ''} />;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
