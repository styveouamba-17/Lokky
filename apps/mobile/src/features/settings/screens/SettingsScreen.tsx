import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Bell } from 'phosphor-react-native/src/icons/Bell';
import { FileText } from 'phosphor-react-native/src/icons/FileText';
import { PaintBrush } from 'phosphor-react-native/src/icons/PaintBrush';
import { Prohibit } from 'phosphor-react-native/src/icons/Prohibit';
import { ShieldCheck } from 'phosphor-react-native/src/icons/ShieldCheck';
import { SignOut } from 'phosphor-react-native/src/icons/SignOut';
import { Trash } from 'phosphor-react-native/src/icons/Trash';
import { UserCircle } from 'phosphor-react-native/src/icons/UserCircle';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { usePreferencesStore } from '@/state/preferences';
import { useSessionStore } from '@/state/session';
import { makeStyles } from '@/theme';
import { Button, ScreenHeader, Sheet, Text } from '@/ui';
import { SettingsRow, SettingsSection } from '../components/SettingsRow';

// Réglages (spec §6.2) : compte, notifications, langue, thème, bloqués, CGU,
// confidentialité, suppression de compte.
export function SettingsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const signOut = useSessionStore((s) => s.signOut);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const theme = usePreferencesStore((s) => s.themePreference);
  const version = Constants.expoConfig?.version ?? '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t('settings.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title={t('settings.sections.account')}>
          <SettingsRow
            icon={UserCircle}
            label={t('settings.profile')}
            onPress={() => router.push('/settings/profile')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.preferences')}>
          <SettingsRow
            icon={Bell}
            label={t('settings.notifications')}
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingsRow
            icon={PaintBrush}
            label={t('settings.appearance')}
            value={t(`settings.look.${theme}`)}
            onPress={() => router.push('/settings/appearance')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.safety')}>
          <SettingsRow
            icon={Prohibit}
            label={t('settings.blocked')}
            onPress={() => router.push('/settings/blocked')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.about')}>
          <SettingsRow
            icon={FileText}
            label={t('settings.terms')}
            onPress={() => router.push('/legal/terms')}
          />
          <SettingsRow
            icon={ShieldCheck}
            label={t('settings.privacy')}
            onPress={() => router.push('/legal/privacy')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.account')}>
          <SettingsRow
            icon={SignOut}
            label={t('settings.signOut')}
            onPress={() => setConfirmSignOut(true)}
          />
          <SettingsRow
            icon={Trash}
            label={t('settings.deleteAccount')}
            danger
            onPress={() => router.push('/settings/delete-account')}
          />
        </SettingsSection>

        {version ? (
          <Text variant="caption" color="textMuted" align="center">
            {t('settings.version', { version })}
          </Text>
        ) : null}
      </ScrollView>

      <Sheet
        visible={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        title={t('settings.signOutTitle')}
      >
        <Text color="textMuted">{t('settings.signOutBody')}</Text>
        <View style={styles.actions}>
          <Button
            label={t('settings.signOut')}
            size="lg"
            fullWidth
            onPress={() => {
              setConfirmSignOut(false);
              void signOut();
            }}
          />
          <Button
            label={t('common.cancel')}
            variant="ghost"
            fullWidth
            onPress={() => setConfirmSignOut(false)}
          />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.screen, gap: t.spacing.xxl, paddingBottom: t.spacing.huge },
  actions: { gap: t.spacing.sm },
}));
