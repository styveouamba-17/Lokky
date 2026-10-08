import type { Activity } from '@lokky/shared';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { Pressable, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { formatActivityWhen } from '@/lib';
import { makeStyles, useTheme } from '@/theme';
import { Badge, Text } from '@/ui';

// Bannière épinglée en haut du chat (spec §6.2) : où et quand se retrouver, toujours visible.
export function PinnedMeetupBanner({
  activity,
  now,
  onPress,
}: {
  activity: Activity;
  now: Date;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { location } = activity;
  const place = location.meetingPoint
    ? `${location.name} · ${location.meetingPoint}`
    : location.name;
  const when = formatActivityWhen(activity.startsAt, now);
  const cancelled = activity.status === 'cancelled';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('chat.pinned')} : ${when}, ${place}${
        cancelled ? `, ${t('activity.cancelled')}` : ''
      }`}
      accessibilityHint={t('chat.pinnedHint')}
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <MapPin size={20} color={colors.onSecondary} weight="fill" />
      </View>
      <View style={styles.body}>
        <View style={styles.whenRow}>
          <Text variant="label" numberOfLines={1} style={styles.when}>
            {when}
          </Text>
          {cancelled ? <Badge label={t('activity.cancelled')} tone="neutral" /> : null}
        </View>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {place}
        </Text>
      </View>
      <CaretRight size={18} color={colors.textMuted} weight="bold" />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    marginHorizontal: t.spacing.lg,
    marginBottom: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  pressed: { backgroundColor: t.colors.surfaceMuted },
  icon: {
    width: 36,
    height: 36,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  whenRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  when: { flexShrink: 1 },
}));
