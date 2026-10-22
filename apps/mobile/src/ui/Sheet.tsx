import { X } from 'phosphor-react-native/src/icons/X';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* Le Modal est plein écran (bord à bord) : la fenêtre ne se redimensionne pas quand le
          clavier s'ouvre. La feuille remonte d'elle-même pour garder le champ visible. */}
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable
          testID="sheet-backdrop"
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          testID="sheet"
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.handle} />
          {/* Croix toujours visible : une feuille haute ne laisse presque pas de fond à toucher. */}
          <View style={styles.header}>
            {title ? (
              <Text variant="heading" accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
            ) : (
              <View style={styles.title} />
            )}
            <IconButton
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              icon={<X size={22} color={colors.text} weight="bold" />}
            />
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: t.colors.overlay,
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.lg,
    borderTopRightRadius: t.radius.lg,
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.md,
    gap: t.spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  title: { flex: 1 },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.border,
  },
}));
