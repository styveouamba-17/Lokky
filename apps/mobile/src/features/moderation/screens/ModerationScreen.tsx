import { Hourglass } from 'phosphor-react-native/src/icons/Hourglass';
import { Prohibit } from 'phosphor-react-native/src/icons/Prohibit';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { formatDayAndHour } from '@/lib';
import { useSessionStore } from '@/state/session';
import { makeStyles } from '@/theme';
import { Button, IconDisc, Illustration, Text, useToast } from '@/ui';
import { useRecheckAccount } from '../hooks/useRecheckAccount';

// Écrans moderation/* (spec §6.2) : ton ferme mais respectueux, et toujours une sortie
// (déconnexion). Suspendu : on peut vérifier si la suspension est levée.
export function ModerationScreen({ kind }: { kind: 'suspended' | 'banned' }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const until = useSessionStore((s) => s.me?.moderation.suspendedUntil ?? null);
  const signOut = useSessionStore((s) => s.signOut);
  const recheck = useRecheckAccount();
  const suspended = kind === 'suspended';

  const onRecheck = () =>
    recheck.mutate(undefined, {
      // Toujours suspendu : la garde ne bouge pas, on le dit clairement.
      onSuccess: (me) => {
        if (me.moderation.status === 'suspended') {
          toast.show(t('moderation.suspended.stillSuspended'), 'info');
        }
      },
      onError: () => toast.show(t('activity.errors.generic'), 'error'),
    });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Illustration
          name={suspended ? 'moderation-suspended' : 'moderation-banned'}
          fallback={<IconDisc icon={suspended ? Hourglass : Prohibit} />}
          style={styles.artwork}
        />
        <Text variant="title" align="center" accessibilityRole="header">
          {suspended ? t('moderation.suspended.title') : t('moderation.banned.title')}
        </Text>
        {suspended ? (
          <Text variant="bodyStrong" align="center">
            {until
              ? t('moderation.suspended.until', { date: formatDayAndHour(until, new Date()) })
              : t('moderation.suspended.indefinite')}
          </Text>
        ) : null}
        <Text color="textMuted" align="center">
          {suspended ? t('moderation.suspended.body') : t('moderation.banned.body')}
        </Text>
      </ScrollView>
      <View style={styles.actions}>
        {suspended ? (
          <Button
            label={t('moderation.suspended.check')}
            size="lg"
            fullWidth
            loading={recheck.isPending}
            onPress={onRecheck}
          />
        ) : null}
        <Button
          label={t('moderation.signOut')}
          variant={suspended ? 'ghost' : 'secondary'}
          size="lg"
          fullWidth
          onPress={() => void signOut()}
        />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.lg,
    padding: t.spacing.screen,
  },
  artwork: { maxWidth: 260 },
  actions: { gap: t.spacing.sm, padding: t.spacing.screen },
}));
