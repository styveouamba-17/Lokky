import { router } from 'expo-router';
import { HandWaving } from 'phosphor-react-native/src/icons/HandWaving';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { EmptyState, IconDisc } from '@/ui';

// Après la suppression du compte : un au revoir, puis retour à l'accueil.
export function GoodbyeScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.screen}>
      <EmptyState
        artwork="account-deleted"
        illustration={<IconDisc icon={HandWaving} />}
        title={t('goodbye.title')}
        description={t('goodbye.body')}
        action={{ label: t('goodbye.action'), onPress: () => router.replace('/') }}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, justifyContent: 'center', backgroundColor: t.colors.bg },
}));
