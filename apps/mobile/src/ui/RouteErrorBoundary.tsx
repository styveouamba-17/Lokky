import type { ErrorBoundaryProps } from 'expo-router';
import { WarningCircle } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { reportError } from '@/lib/monitoring';
import { makeStyles } from '@/theme';
import { EmptyState } from './EmptyState';
import { IconDisc } from './IconDisc';

// Écran d'erreur de chaque route (spec §7.5) : exporté comme ErrorBoundary par les fichiers
// de app/. Signale l'erreur à Sentry et propose de réessayer, sans faire planter l'app.
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  useEffect(() => reportError(error), [error]);
  return (
    <SafeAreaView style={styles.screen}>
      <EmptyState
        artwork="error-generic"
        illustration={<IconDisc icon={WarningCircle} />}
        title={t('errors.screen.title')}
        description={t('errors.screen.body')}
        action={{ label: t('common.retry'), onPress: () => void retry() }}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, justifyContent: 'center', backgroundColor: t.colors.bg },
}));
