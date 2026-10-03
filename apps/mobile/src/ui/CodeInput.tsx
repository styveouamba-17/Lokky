import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { MAX_FONT_SCALE, makeStyles } from '@/theme';
import { Text } from './Text';

// Code à N chiffres : un seul champ invisible (collage et remplissage auto du clavier),
// affiché en cases. Pas de maxLength natif : il tronquerait « 123 456 » collé avec un espace.
export function CodeInput({
  value,
  onChange,
  length = 6,
  label,
  error,
  disabled = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  label: string;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const styles = useStyles();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(autoFocus);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => input.current?.focus()} style={styles.row} accessible={false}>
        {Array.from({ length }, (_, i) => {
          const active = focused && i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              style={[styles.cell, active && styles.cellActive, error && styles.cellError]}
            >
              <Text variant="title" maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {value[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
        caretHidden
        style={styles.hidden}
      />
      {error ? (
        <Text variant="caption" color="danger" align="center" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { gap: t.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'center', gap: t.spacing.sm },
  cell: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  cellActive: { borderColor: t.colors.action },
  cellError: { borderColor: t.colors.danger },
  // Champ réel posé sur les cases mais transparent : il reçoit focus, collage et saisie.
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, opacity: 0.011 },
}));
