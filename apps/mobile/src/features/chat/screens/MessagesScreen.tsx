import { ChatsCircle } from 'phosphor-react-native/src/icons/ChatsCircle';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { EmptyState, IconDisc, Text } from '@/ui';

// Liste des conversations au jalon 5 (chat de groupe). En attendant : état vide avec action.
export function MessagesScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {t('messages.title')}
      </Text>
      <EmptyState
        artwork="empty-messages"
        illustration={<IconDisc icon={ChatsCircle} />}
        title={t('messages.emptyTitle')}
        description={t('messages.emptyBody')}
        action={{ label: t('messages.action'), onPress: () => router.navigate('/discover') }}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  title: { paddingHorizontal: t.spacing.screen, paddingTop: t.spacing.md },
}));
