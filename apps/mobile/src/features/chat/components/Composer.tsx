import { LIMITS } from '@lokky/shared';
import { PaperPlaneRight } from 'phosphor-react-native/src/icons/PaperPlaneRight';
import { X } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { MAX_FONT_SCALE, makeStyles, useTheme } from '@/theme';
import { Text } from '@/ui';
import type { MessageReply } from '@lokky/shared';

// Champ de saisie du chat. Le message part par la file d'envoi : il s'affiche tout de suite,
// même hors ligne.
export function Composer({
  onSend,
  replyTo,
  editing,
  onCancelAction,
  onEdit,
}: {
  onSend: (body: string, replyTo: MessageReply | null) => void;
  replyTo: MessageReply | null;
  editing: { id: string; body: string } | null;
  onCancelAction: () => void;
  onEdit: (id: string, body: string) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [body, setBody] = useState(editing?.body ?? '');
  const canSend = body.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    if (editing) onEdit(editing.id, body);
    else {
      onSend(body, replyTo);
      setBody('');
    }
  };

  return (
    <View style={styles.bar}>
      {editing || replyTo ? (
        <View style={styles.context}>
          <View style={styles.contextText}>
            <Text variant="caption" color="secondary">
              {editing
                ? t('chat.editing')
                : t('chat.replyingTo', {
                    name: replyTo?.sender?.firstName ?? t('chat.replyUnknown'),
                  })}
            </Text>
            {replyTo && !editing ? (
              <Text variant="caption" color="textMuted" numberOfLines={1}>
                {replyTo.body}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.cancelMessageAction')}
            onPress={onCancelAction}
            hitSlop={8}
          >
            <X size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel={t('chat.inputLabel')}
          value={body}
          onChangeText={setBody}
          placeholder={editing ? t('chat.editPlaceholder') : t('chat.placeholder')}
          placeholderTextColor={colors.textMuted}
          maxLength={LIMITS.message.bodyMax}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          multiline
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? t('chat.saveEdit') : t('chat.send')}
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
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    flexDirection: 'column',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: t.spacing.sm },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.xs,
  },
  contextText: { flex: 1, gap: 2 },
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
