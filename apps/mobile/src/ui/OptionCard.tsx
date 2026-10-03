import { CheckCircle } from 'phosphor-react-native/src/icons/CheckCircle';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import type { IconComponent } from './icons';
import { Text } from './Text';

// Carte à choisir (statut, autorisation). Choix unique : accessibilityRole radio.
export function OptionCard({
  icon: Icon,
  title,
  body,
  selected = false,
  onPress,
  right,
  role = 'radio',
}: {
  icon: IconComponent;
  title: string;
  body?: string;
  selected?: boolean;
  onPress?: () => void;
  right?: ReactNode;
  role?: 'radio' | 'none';
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const content = (
    <>
      <View
        style={[styles.iconDisc, selected && styles.iconDiscSelected]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Icon size={24} color={selected ? colors.onAction : colors.action} weight="duotone" />
      </View>
      <View style={styles.copy}>
        <Text variant="bodyStrong">{title}</Text>
        {body ? (
          <Text variant="caption" color="textMuted">
            {body}
          </Text>
        ) : null}
      </View>
      {right ?? (selected ? <CheckCircle size={24} color={colors.action} weight="fill" /> : null)}
    </>
  );

  if (!onPress) return <View style={styles.card}>{content}</View>;
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={body ? `${title}. ${body}` : title}
      accessibilityState={role === 'radio' ? { checked: selected } : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: 64,
    padding: t.spacing.lg,
    borderRadius: t.radius.lg,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  selected: { borderColor: t.colors.action },
  pressed: { opacity: 0.9 },
  iconDisc: {
    width: 44,
    height: 44,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surfaceMuted,
  },
  iconDiscSelected: { backgroundColor: t.colors.action },
  copy: { flex: 1, gap: 2 },
}));
