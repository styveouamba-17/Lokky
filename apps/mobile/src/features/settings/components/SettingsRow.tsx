import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { Text, type IconComponent } from '@/ui';

// Ligne de réglage : icône, libellé, valeur ou contrôle à droite.
export function SettingsRow({
  icon: Icon,
  label,
  description,
  value,
  right,
  onPress,
  danger = false,
}: {
  icon: IconComponent;
  label: string;
  description?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const content = (
    <>
      <Icon size={22} color={danger ? colors.danger : colors.text} weight="regular" />
      <View style={styles.text}>
        <Text variant="bodyStrong" color={danger ? 'danger' : 'text'}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" color="textMuted">
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="caption" color="textMuted">
          {value}
        </Text>
      ) : null}
      {right ?? (onPress ? <CaretRight size={18} color={colors.textMuted} weight="bold" /> : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text variant="caption" color="textMuted" accessibilityRole="header" style={styles.title}>
        {title.toUpperCase()}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.spacing.sm },
  title: { paddingHorizontal: t.spacing.xs, letterSpacing: 0.5 },
  card: {
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  pressed: { backgroundColor: t.colors.surfaceMuted },
  text: { flex: 1, gap: 2 },
}));
