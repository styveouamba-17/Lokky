import { LIMITS } from '@lokky/shared';
import { PaperPlaneRight } from 'phosphor-react-native/src/icons/PaperPlaneRight';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { MAX_FONT_SCALE, makeStyles, useTheme } from '@/theme';

// Champ de saisie du chat. Le message part par la file d'envoi : il s'affiche tout de suite,
// même hors ligne.
export function Composer({ onSend }: { onSend: (body: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const canSend = body.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(body);
    setBody('');
  };

  return (
    <View style={styles.bar}>
      <TextInput
        accessibilityLabel={t('chat.inputLabel')}
        value={body}
        onChangeText={setBody}
        placeholder={t('chat.placeholder')}
        placeholderTextColor={colors.textMuted}
        maxLength={LIMITS.message.bodyMax}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        multiline
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('chat.send')}
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={submit}
        style={({ pressed }) => [
          styles.send,
          !canSend && styles.sendDisabled,
          pressed && styles.pressed,
        ]}
      >
        <PaperPlaneRight size={22} color={colors.onAction} weight="fill" />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 132,
    borderRadius: 22,
    paddingHorizontal: t.spacing.lg,
    paddingTop: 11,
    paddingBottom: 11,
    backgroundColor: t.colors.surfaceMuted,
    color: t.colors.text,
    fontFamily: t.typography.body.fontFamily,
    fontSize: t.typography.body.fontSize,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
}));
