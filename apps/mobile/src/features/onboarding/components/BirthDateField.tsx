import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Button, Sheet, Text } from '@/ui';

// Date ISO (AAAA-MM-JJ) ↔ Date locale du sélecteur, sans décalage de fuseau.
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1);
};
const DISPLAY = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function defaultDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 20);
  return d;
}

export function BirthDateField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (iso: string) => void;
  error?: string | null;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ? fromIso(value) : defaultDate());
  const label = t('onboarding.you.birthDate');

  const open = () => {
    const current = value ? fromIso(value) : defaultDate();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toIso(date));
        },
      });
      return;
    }
    setDraft(current);
    setSheetOpen(true);
  };

  return (
    <View style={styles.container}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={value ? { text: DISPLAY.format(fromIso(value)) } : undefined}
        accessibilityHint={error ?? undefined}
        onPress={open}
        style={({ pressed }) => [
          styles.field,
          error && styles.fieldError,
          pressed && styles.pressed,
        ]}
      >
        <Text color={value ? 'text' : 'textMuted'}>
          {value ? DISPLAY.format(fromIso(value)) : t('onboarding.you.birthDatePlaceholder')}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title={label}>
        <DateTimePicker
          value={draft}
          mode="date"
          display="spinner"
          locale="fr-FR"
          maximumDate={new Date()}
          themeVariant={theme.scheme}
          onChange={(_, date) => date && setDraft(date)}
        />
        <Button
          label={t('common.validate')}
          fullWidth
          onPress={() => {
            onChange(toIso(draft));
            setSheetOpen(false);
          }}
        />
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { gap: t.spacing.xs },
  field: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  fieldError: { borderColor: t.colors.danger },
  pressed: { opacity: 0.85 },
}));
