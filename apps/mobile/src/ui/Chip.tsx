import { Pressable } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import type { IconComponent } from './icons';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconComponent;
}

export function Chip({ label, selected = false, onPress, icon: Icon }: ChipProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {Icon ? (
        <Icon
          size={16}
          color={selected ? colors.onAction : colors.text}
          weight={selected ? 'fill' : 'regular'}
        />
      ) : null}
      <Text variant="label" color={selected ? 'onAction' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  chip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  selected: { backgroundColor: t.colors.action, borderColor: t.colors.action },
  pressed: { opacity: 0.8 },
}));
