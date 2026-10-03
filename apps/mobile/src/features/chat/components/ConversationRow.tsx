import type { Conversation } from '@lokky/shared';
import { Pressable, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { formatMessageTime } from '@/lib';
import { makeStyles } from '@/theme';
import { Avatar, Text } from '@/ui';

export function ConversationRow({
  conversation: c,
  viewerId,
  now,
  onPress,
}: {
  conversation: Conversation;
  viewerId: string | null;
  now: Date;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const last = c.lastMessage;
  const unread = c.unreadCount > 0;

  const preview = !last
    ? t('messages.noMessage')
    : last.type === 'system' || !last.sender
      ? last.body
      : last.sender.id === viewerId
        ? t('messages.you', { body: last.body })
        : c.type === 'direct'
          ? last.body // en privé, pas besoin de rappeler qui écrit
          : `${last.sender.firstName} : ${last.body}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unread ? `${c.title}, ${t('messages.unread', { count: c.unreadCount })}` : c.title
      }
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar name={c.title} uri={c.avatarUrl} size="lg" />
      <View style={styles.body}>
        <View style={styles.line}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {c.title}
          </Text>
          {last ? (
            <Text variant="caption" color={unread ? 'action' : 'textMuted'}>
              {formatMessageTime(last.createdAt, now)}
            </Text>
          ) : null}
        </View>
        <View style={styles.line}>
          <Text
            variant={unread ? 'label' : 'body'}
            color={unread ? 'text' : 'textMuted'}
            numberOfLines={1}
            style={styles.title}
          >
            {preview}
          </Text>
          {unread ? (
            <View style={styles.badge}>
              <Text variant="caption" color="onAction" maxFontSizeMultiplier={1.2}>
                {c.unreadCount > 99 ? '99+' : String(c.unreadCount)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.screen,
    paddingVertical: t.spacing.md,
  },
  pressed: { backgroundColor: t.colors.surfaceMuted },
  body: { flex: 1, gap: 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  title: { flex: 1 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
