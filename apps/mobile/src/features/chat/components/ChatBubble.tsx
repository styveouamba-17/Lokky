import type { UserPreview } from '@lokky/shared';
import { Clock } from 'phosphor-react-native/src/icons/Clock';
import { WarningCircle } from 'phosphor-react-native/src/icons/WarningCircle';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from '@/i18n';
import { formatHour } from '@/lib';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { makeStyles, motion, useTheme } from '@/theme';
import { Avatar, Text } from '@/ui';
import type { BubbleStatus } from '../timeline';

const AVATAR_SPACE = 28;

export function ChatBubble({
  body,
  replyTo,
  editedAt,
  createdAt,
  mine,
  sender,
  showSender,
  status,
  onRetry,
  onReply,
  onOpenReply,
  onActions,
}: {
  body: string;
  replyTo: { id: string; body: string; sender: UserPreview | null } | null;
  editedAt: string | null;
  createdAt: string;
  mine: boolean;
  sender: UserPreview | null;
  showSender: boolean;
  status: BubbleStatus;
  onRetry?: () => void;
  onReply?: () => void;
  onOpenReply?: () => void;
  onActions?: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const failed = status === 'failed';
  const pending = status === 'waiting' || status === 'sending';
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));
  const replyGesture = Gesture.Pan()
    .enabled(Boolean(onReply))
    .activeOffsetX(10)
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.set(Math.max(0, Math.min(event.translationX, 88)));
    })
    .onEnd((event, success) => {
      if (success && event.translationX >= 64 && onReply) runOnJS(onReply)();
      translateX.set(withSpring(0, { damping: 18, stiffness: 220 }));
    })
    .onFinalize(() => {
      translateX.set(withSpring(0, { damping: 18, stiffness: 220 }));
    });

  const replyPreview = replyTo ? (
    <View style={[styles.reply, mine ? styles.replyMine : styles.replyTheirs]}>
      <Text variant="caption" style={styles.replySender} numberOfLines={1}>
        {replyTo.sender?.firstName ?? t('chat.replyUnknown')}
      </Text>
      <Text variant="caption" color="text" numberOfLines={2}>
        {replyTo.body}
      </Text>
    </View>
  ) : null;

  const bubble = (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs, pending && styles.pending]}>
      {replyPreview ? (
        onOpenReply && replyTo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.openRepliedMessage')}
            onPress={onOpenReply}
          >
            {replyPreview}
          </Pressable>
        ) : (
          replyPreview
        )
      ) : null}
      {showSender && sender ? (
        <Text variant="caption" color="secondary">
          {sender.firstName}
        </Text>
      ) : null}
      <Text color={mine ? 'onAction' : 'text'} selectable>
        {body}
      </Text>
    </View>
  );

  return (
    // Fondu simple : la liste du chat est inversée, une direction serait elle aussi inversée.
    <GestureDetector gesture={replyGesture}>
      <Animated.View
        entering={FadeIn.duration(motion.base)}
        style={[styles.row, mine ? styles.rowMine : styles.rowTheirs, animatedStyle]}
      >
        {!mine ? (
          <View style={styles.avatar}>
            {showSender && sender ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('profile.openProfile', { name: sender.firstName })}
                onPress={() => router.push({ pathname: '/user/[id]', params: { id: sender.id } })}
                hitSlop={6}
              >
                <Avatar name={sender.firstName} uri={sender.avatarUrl} size="sm" />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={[styles.column, mine && styles.columnMine]}>
          {failed ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${body}. ${t('chat.failed')}`}
              onPress={onRetry}
            >
              {bubble}
            </Pressable>
          ) : onActions ? (
            <Pressable
              accessibilityHint={onReply ? t('chat.replySwipeHint') : t('chat.messageActions')}
              accessibilityActions={[
                ...(onReply ? [{ name: 'reply', label: t('chat.reply') }] : []),
                { name: 'actions', label: t('chat.messageActions') },
              ]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'reply') onReply?.();
                else onActions();
              }}
              onLongPress={onActions}
              delayLongPress={350}
            >
              {bubble}
            </Pressable>
          ) : (
            bubble
          )}
          <View style={styles.meta}>
            {status === 'waiting' ? <Clock size={12} color={colors.textMuted} /> : null}
            {failed ? <WarningCircle size={12} color={colors.danger} weight="fill" /> : null}
            <Text variant="caption" color={failed ? 'danger' : 'textMuted'}>
              {failed
                ? t('chat.failed')
                : status === 'waiting'
                  ? t('chat.waiting')
                  : status === 'sending'
                    ? t('chat.sending')
                    : `${formatHour(new Date(createdAt))}${editedAt ? ` · ${t('chat.edited')}` : ''}`}
            </Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', paddingHorizontal: t.spacing.lg, gap: t.spacing.sm },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  avatar: { width: AVATAR_SPACE, paddingTop: 2 },
  column: { maxWidth: '78%', gap: 2, alignItems: 'flex-start' },
  columnMine: { alignItems: 'flex-end' },
  bubble: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.lg,
    gap: 2,
  },
  mine: { backgroundColor: t.colors.action, borderBottomRightRadius: t.radius.sm / 2 },
  theirs: {
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderBottomLeftRadius: t.radius.sm / 2,
  },
  pending: { opacity: 0.7 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: t.spacing.xs },
  reply: {
    borderLeftWidth: 2,
    paddingLeft: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    paddingRight: t.spacing.sm,
    marginBottom: t.spacing.sm,
    maxWidth: 240,
    borderRadius: t.radius.sm,
  },
  replyMine: { backgroundColor: t.colors.surface, borderLeftColor: t.colors.action },
  replyTheirs: { backgroundColor: t.colors.surfaceMuted, borderLeftColor: t.colors.secondary },
  replySender: { color: t.colors.text, fontFamily: t.typography.label.fontFamily },
}));
