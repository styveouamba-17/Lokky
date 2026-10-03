import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { Prohibit } from 'phosphor-react-native/src/icons/Prohibit';
import { UserCircle } from 'phosphor-react-native/src/icons/UserCircle';
import type { UserProfile } from '@lokky/shared';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Card, EmptyState, IconButton, IconDisc, Skeleton, Text } from '@/ui';
import { ProfileMenuButton, useProfileActions } from '../components/ProfileActions';
import {
  Interests,
  OrganizedActivities,
  ProfileHeader,
  TrustStats,
} from '../components/ProfileSections';
import { useOrganizedActivities, useUser } from '../hooks/useProfile';

// Profil public (spec §6.2) : ouvert depuis « Qui vient ? », le créateur ou le chat.
// « Écrire » après une sortie partagée ; signaler et bloquer depuis le menu « … ».
export function UserProfileScreen({ id }: { id: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const user = useUser(id);
  const organized = useOrganizedActivities(id);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          icon={<ArrowLeft size={24} color={colors.text} weight="bold" />}
        />
      </View>
      {user.isPending ? (
        <View style={styles.content}>
          <Skeleton height={96} width={96} radius={48} />
          <Skeleton height={120} />
        </View>
      ) : user.isError ? (
        <EmptyState
          illustration={<IconDisc icon={UserCircle} />}
          title={t('profile.notFound')}
          action={{ label: t('common.back'), onPress: () => router.back() }}
        />
      ) : (
        <Loaded user={user.data}>
          <OrganizedActivities
            title={t('profile.upcomingOrganized')}
            activities={organized.data}
            loading={organized.isPending}
          />
        </Loaded>
      )}
    </View>
  );
}

function Loaded({ user, children }: { user: UserProfile; children: ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { openMenu, messageButton, sheets } = useProfileActions(user);
  return (
    <>
      <View style={[styles.menu, { top: insets.top }]}>
        <ProfileMenuButton onOpen={openMenu} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <ProfileHeader user={user} />
        {messageButton}
        {user.relationship.isBlocked ? (
          <Card style={styles.blocked}>
            <Prohibit size={20} color={colors.danger} weight="bold" />
            <Text variant="caption" style={styles.flex}>
              {t('profile.blockedNotice', { name: user.firstName })}
            </Text>
          </Card>
        ) : null}
        <TrustStats trust={user.trust} />
        <Interests interests={user.interests} />
        {children}
      </ScrollView>
      {sheets}
    </>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  header: { minHeight: 56, justifyContent: 'center', paddingHorizontal: t.spacing.sm },
  content: { paddingHorizontal: t.spacing.screen, gap: t.spacing.xxl, alignItems: 'stretch' },
  menu: { position: 'absolute', right: t.spacing.sm, minHeight: 56, justifyContent: 'center' },
  blocked: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  flex: { flex: 1 },
}));
