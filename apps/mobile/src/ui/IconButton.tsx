import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { makeStyles } from '@/theme';

export interface IconButtonProps {
  icon: ReactNode;
  accessibilityLabel: string; // obligatoire : un bouton-icône n'a pas de texte visible
  onPress: () => void;
  variant?: 'plain' | 'filled';
  disabled?: boolean;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  disabled = false,
}: IconButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'filled' && styles.filled,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    width: 44,
    height: 44,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: t.colors.surfaceMuted },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
}));
