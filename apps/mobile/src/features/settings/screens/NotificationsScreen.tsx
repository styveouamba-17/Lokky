import type { Preferences } from '@lokky/shared';
import { router } from 'expo-router';
import { Bell } from 'phosphor-react-native/src/icons/Bell';
import { CalendarCheck } from 'phosphor-react-native/src/icons/CalendarCheck';
import { ChatsCircle } from 'phosphor-react-native/src/icons/ChatsCircle';
import { ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import { ScreenHeader, Text, useToast, type IconComponent } from '@/ui';
import { PhoneNotificationsCard } from '../components/PhoneNotificationsCard';
import { SettingsRow, SettingsSection } from '../components/SettingsRow';
import { useUpdatePreferences } from '../hooks/useUpdatePreferences';

type Kind = keyof Preferences['notifications'];
const KINDS: { kind: Kind; icon: IconComponent }[] = [
  { kind: 'messages', icon: ChatsCircle },
  { kind: 'activityUpdates', icon: CalendarCheck },
  { kind: 'reminders', icon: Bell },
];

export function NotificationsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const preferences = useSessionStore((s) => s.me?.preferences);
  const update = useUpdatePreferences();
  if (!preferences) return null;

  const toggle = (kind: Kind, value: boolean) =>
    update.mutate(
      { ...preferences, notifications: { ...preferences.notifications, [kind]: value } },
      { onError: () => toast.show(t('settings.error'), 'error') },
    );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t('settings.notif.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text color="textMuted">{t('settings.notif.body')}</Text>
        <PhoneNotificationsCard />
        <SettingsSection title={t('settings.notif.title')}>
          {KINDS.map(({ kind, icon }) => (
            <SettingsRow
              key={kind}
              icon={icon}
              label={t(`settings.notif.${kind}`)}
              description={t(`settings.notif.${kind}Body`)}
              right={
                <Switch
                  accessibilityLabel={t(`settings.notif.${kind}`)}
                  value={preferences.notifications[kind]}
                  onValueChange={(value) => toggle(kind, value)}
                  trackColor={{ true: colors.action, false: colors.border }}
                  thumbColor={colors.surface}
                />
              }
            />
          ))}
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.screen, gap: t.spacing.xl },
}));
