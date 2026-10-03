import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { EmptyState, IconDisc, Text } from '@/ui';

// Onglets À venir · Passées · Créées par moi au jalon 6. En attendant : état vide avec action.
export function MyActivitiesScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {t('mine.title')}
      </Text>
      <EmptyState
        artwork="empty-upcoming"
        illustration={<IconDisc icon={CalendarBlank} />}
        title={t('mine.emptyTitle')}
        description={t('mine.emptyBody')}
        action={{ label: t('mine.action'), onPress: () => router.navigate('/discover') }}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  title: { paddingHorizontal: t.spacing.screen, paddingTop: t.spacing.md },
}));
