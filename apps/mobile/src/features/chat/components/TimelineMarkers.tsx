import type { UserPreview } from '@lokky/shared';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Text } from '@/ui';

// Séparateur de jour : « Aujourd’hui », « Hier »…
export function DaySeparator({ label }: { label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <View style={styles.pill}>
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      </View>
    </View>
  );
}

// Message système : « Awa a rejoint le groupe ».
export function SystemMessage({ body }: { body: string }) {
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <Text variant="caption" color="textMuted" align="center">
        {body}
      </Text>
    </View>
  );
}

export function TypingIndicator({ users }: { users: readonly UserPreview[] }) {
  const styles = useStyles();
  const { t } = useTranslation();
  if (users.length === 0) return null;
  return (
    <View style={styles.typing} accessibilityLiveRegion="polite">
      <Text variant="caption" color="textMuted">
        {t('chat.typing', { count: users.length, name: users[0]?.firstName ?? '' })}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  center: { alignItems: 'center', paddingHorizontal: t.spacing.xxl, paddingVertical: t.spacing.xs },
  pill: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: 2,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.surfaceMuted,
  },
  typing: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.xs },
}));
