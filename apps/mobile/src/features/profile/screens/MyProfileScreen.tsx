import { router, type Href } from 'expo-router';
import { GearSix } from 'phosphor-react-native/src/icons/GearSix';
import { PencilSimple } from 'phosphor-react-native/src/icons/PencilSimple';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import { Button, IconButton } from '@/ui';
import {
  Interests,
  OrganizedActivities,
  ProfileHeader,
  TrustStats,
} from '../components/ProfileSections';
import { useOrganizedActivities, useUser } from '../hooks/useProfile';

// Le générateur de types d'Expo (sous Windows) déclare l'index du dossier comme
// « /settings/index » ; à l'exécution, la route est bien « /settings ».
const SETTINGS_HREF = '/settings' as Href;

// Mon profil : le même format que le profil public, plus l'accès aux réglages.
export function MyProfileScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const me = useSessionStore((s) => s.me);
  const { colors } = useTheme();
  // Les statistiques bougent avec les avis et la présence : version publique à jour,
  // le profil de la session s'affiche en attendant.
  const fresh = useUser(me?.id ?? '');
  const organized = useOrganizedActivities(me?.id ?? '');
  if (!me) return null;
  const user = fresh.data ?? me;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          accessibilityLabel={t('profile.settings')}
          onPress={() => router.push(SETTINGS_HREF)}
          icon={<GearSix size={26} color={colors.text} />}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileHeader user={user} />
        <Button
          label={t('profile.edit')}
          variant="secondary"
          fullWidth
          icon={<PencilSimple size={18} color={colors.action} weight="bold" />}
          onPress={() => router.push('/settings/profile')}
        />
        <TrustStats trust={user.trust} />
        <Interests interests={user.interests} />
        <OrganizedActivities
          title={t('profile.myUpcomingOrganized')}
          activities={organized.data}
          loading={organized.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  topBar: { alignItems: 'flex-end', paddingHorizontal: t.spacing.sm },
  content: { padding: t.spacing.screen, paddingTop: 0, gap: t.spacing.xxl },
}));
