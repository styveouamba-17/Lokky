import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { makeStyles } from '@/theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {icon}
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
