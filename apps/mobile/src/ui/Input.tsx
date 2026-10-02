import { useState, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { MAX_FONT_SCALE, makeStyles, useTheme } from '@/theme';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style' | 'editable'> {
  label: string;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
  showCounter?: boolean;
  ref?: Ref<TextInput>;
}

export function Input({
  label,
  error,
  hint,
  disabled = false,
  showCounter = false,
  multiline,
  maxLength,
  value,
  onFocus,
  onBlur,
  ref,
  ...rest
}: InputProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <TextInput
        {...rest}
        ref={ref}
        accessibilityLabel={label}
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        editable={!disabled}
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error ? styles.error : null,
          disabled && styles.disabled,
        ]}
      />
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      ) : null}
      {showCounter && maxLength ? (
        <Text variant="caption" color="textMuted" align="right">
          {`${value?.length ?? 0}/${maxLength}`}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { gap: t.spacing.xs },
  input: {
    minHeight: 48,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.lg,
    color: t.colors.text,
    fontFamily: t.typography.body.fontFamily,
    fontSize: t.typography.body.fontSize,
  },
  multiline: { minHeight: 120, paddingTop: t.spacing.md, textAlignVertical: 'top' },
  focused: { borderColor: t.colors.action },
  error: { borderColor: t.colors.danger },
  disabled: { opacity: 0.5 },
}));
