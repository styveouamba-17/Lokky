import { CheckCircle } from 'phosphor-react-native/src/icons/CheckCircle';
import type { Activity, UserPreview } from '@lokky/shared';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChatsCircle } from 'phosphor-react-native/src/icons/ChatsCircle';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isApiError } from '@/api/errors';
import { useTranslation } from '@/i18n';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { makeStyles, motion, useTheme } from '@/theme';
import { Button, Text, useToast } from '@/ui';
import { useParticipation } from '../hooks/useParticipation';
import { AfterActivityActions } from './AfterActivityActions';

const KNOWN_ERRORS = ['activity_full', 'activity_started'] as const;

// Barre fixe en bas du détail (spec §6.2). Rejoindre ajoute aussi au chat du groupe : le
// bouton « Discuter avec le groupe » apparaît dès que le serveur l'a confirmé (créateur compris).
export function JoinBar({ activity, me }: { activity: Activity; me: UserPreview }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const toast = useToast();
  const { colors } = useTheme();
  const participation = useParticipation(activity.id, me);
  const { viewerState } = activity;
  const full = activity.participantCount >= activity.capacity;

  const conversationId = viewerState.conversationId;
  const upcoming = activity.status === 'upcoming';
  if (!conversationId && !upcoming) return null;
  // Une action d'après-sortie en attente passe devant le chat.
  const chatPrimary =
    viewerState.isCreator && !viewerState.canReview && !viewerState.canDeclareAttendance;
  const openChat = conversationId ? (
    <Button
      label={t('activity.openChat')}
      variant={chatPrimary ? 'primary' : 'secondary'}
      fullWidth
      icon={
        <ChatsCircle
          size={20}
          color={chatPrimary ? colors.onAction : colors.action}
          weight="fill"
        />
      }
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conversationId } })}
    />
  ) : null;
  if (viewerState.isCreator || !upcoming) {
    return (
      <View style={[styles.bar, styles.stack, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <AfterActivityActions activity={activity} />
        {openChat}
      </View>
    );
  }

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
          <Animated.View entering={ZoomIn.duration(motion.base)} style={styles.goingLabel}>
            <CheckCircle size={22} color={colors.success} weight="fill" />
            <Text variant="bodyStrong" color="success">
              {t('activity.going')}
            </Text>
          </Animated.View>
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
      ) : null}
      {viewerState.isParticipant ? (
        openChat
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
  stack: { gap: t.spacing.sm },
  goingLabel: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  going: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));
