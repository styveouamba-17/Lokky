import type { UserPreview } from '@lokky/shared';
import { Clock } from 'phosphor-react-native/src/icons/Clock';
import { WarningCircle } from 'phosphor-react-native/src/icons/WarningCircle';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { formatHour } from '@/lib';
import Animated, { FadeIn } from 'react-native-reanimated';
import { makeStyles, motion, useTheme } from '@/theme';
import { Avatar, Text } from '@/ui';
import type { BubbleStatus } from '../timeline';

const AVATAR_SPACE = 28;

export function ChatBubble({
  body,
  createdAt,
  mine,
  sender,
  showSender,
  status,
  onRetry,
  onReport,
}: {
  body: string;
  createdAt: string;
  mine: boolean;
  sender: UserPreview | null;
  showSender: boolean;
  status: BubbleStatus;
  onRetry?: () => void;
  // Appui long sur le message de quelqu'un d'autre : le signaler.
  onReport?: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const failed = status === 'failed';
  const pending = status === 'waiting' || status === 'sending';

  const bubble = (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs, pending && styles.pending]}>
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
    <Animated.View
      entering={FadeIn.duration(motion.base)}
      style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}
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
        ) : onReport ? (
          <Pressable
            accessibilityHint={t('chat.reportMessage')}
            accessibilityActions={[{ name: 'report', label: t('chat.reportMessage') }]}
            onAccessibilityAction={onReport}
            onLongPress={onReport}
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
                  : formatHour(new Date(createdAt))}
          </Text>
        </View>
      </View>
    </Animated.View>
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
}));
