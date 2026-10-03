import { CheckCircle } from 'phosphor-react-native/src/icons/CheckCircle';
import type { Activity, UserPreview } from '@lokky/shared';
import * as Haptics from 'expo-haptics';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isApiError } from '@/api/errors';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Button, Text, useToast } from '@/ui';
import { useParticipation } from '../hooks/useParticipation';

const KNOWN_ERRORS = ['activity_full', 'activity_started'] as const;

// Barre fixe en bas du détail (spec §6.2). Rien pour le créateur ni pour une sortie passée.
export function JoinBar({ activity, me }: { activity: Activity; me: UserPreview }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const toast = useToast();
  const { colors } = useTheme();
  const participation = useParticipation(activity.id, me);
  const { viewerState } = activity;
  const full = activity.participantCount >= activity.capacity;

  if (viewerState.isCreator || activity.status !== 'upcoming') return null;

  const change = (joining: boolean) => {
    if (joining) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    participation.mutate(joining, {
      onSuccess: () => toast.show(joining ? t('activity.joined') : t('activity.left'), 'success'),
      onError: (error) => {
        const code = isApiError(error) ? error.code : null;
        const known = KNOWN_ERRORS.find((k) => k === code);
        toast.show(known ? t(`activity.errors.${known}`) : t('activity.errors.generic'), 'error');
      },
    });
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {viewerState.isParticipant ? (
        <View style={styles.going}>
          <View style={styles.goingLabel}>
            <CheckCircle size={22} color={colors.success} weight="fill" />
            <Text variant="bodyStrong" color="success">
              {t('activity.going')}
            </Text>
          </View>
          {viewerState.canLeave ? (
            <Button
              label={t('activity.leave')}
              variant="ghost"
              size="sm"
              disabled={participation.isPending}
              onPress={() => change(false)}
            />
          ) : null}
        </View>
      ) : (
        <Button
          label={full ? t('activity.full') : t('activity.join')}
          size="lg"
          fullWidth
          disabled={!viewerState.canJoin || participation.isPending}
          onPress={() => change(true)}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    paddingHorizontal: t.spacing.screen,
    paddingTop: t.spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  goingLabel: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  going: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));
