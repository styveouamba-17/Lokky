import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const foreground =
    variant === 'primary' || variant === 'danger' ? colors.onAction : colors.action;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon}
          <Text variant="label" style={{ color: foreground }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sm: { minHeight: 44, paddingHorizontal: t.spacing.md },
  md: { minHeight: 48, paddingHorizontal: t.spacing.lg },
  lg: { minHeight: 56, paddingHorizontal: t.spacing.xl },
  primary: { backgroundColor: t.colors.action },
  secondary: { borderColor: t.colors.action },
  ghost: {},
  danger: { backgroundColor: t.colors.danger },
  fullWidth: { alignSelf: 'stretch' },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
}));
