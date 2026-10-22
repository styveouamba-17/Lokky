import type { ComponentType } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Text } from '@/ui';

type Icon = ComponentType<{ size?: number; color?: string; weight?: 'regular' | 'bold' }>;

export interface MessageMenuItem {
  key: string;
  label: string;
  icon: Icon;
  destructive?: boolean;
  onPress: () => void;
}

const ITEM_HEIGHT = 48;
const MENU_PADDING = 6;
const GAP = 8;

// Menu d'un message (appui long) : s'ouvre là où le doigt s'est posé, côté de la bulle.
// Sous le doigt s'il y a la place, sinon au-dessus. Toucher ailleurs le referme.
export function MessageMenu({
  visible,
  touchY,
  mine,
  items,
  onClose,
}: {
  visible: boolean;
  // Hauteur du doigt dans la fenêtre ; null (accessibilité) : menu centré.
  touchY: number | null;
  mine: boolean;
  items: readonly MessageMenuItem[];
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const menuHeight = items.length * ITEM_HEIGHT + MENU_PADDING * 2;
  const minTop = insets.top + GAP;
  const maxTop = height - insets.bottom - menuHeight - GAP;
  const below = touchY === null ? (height - menuHeight) / 2 : touchY + GAP;
  const top = Math.max(
    minTop,
    touchY !== null && below > maxTop ? touchY - menuHeight - GAP : Math.min(below, maxTop),
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        testID="message-menu-backdrop"
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        onPress={onClose}
        style={styles.backdrop}
      />
      <View
        accessibilityRole="menu"
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
        style={[styles.menu, mine ? styles.menuMine : styles.menuTheirs, { top }]}
      >
        {items.map(({ key, label, icon: Glyph, destructive, onPress }) => {
          const color = destructive ? colors.danger : colors.text;
          return (
            <Pressable
              key={key}
              accessibilityRole="menuitem"
              accessibilityLabel={label}
              onPress={() => {
                onClose();
                onPress();
              }}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <Glyph size={20} color={color} />
              <Text style={{ color }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: t.colors.overlay,
  },
  menu: {
    position: 'absolute',
    minWidth: 220,
    paddingVertical: MENU_PADDING,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuMine: { right: t.spacing.lg },
  // Aligné sur les bulles reçues (après la place de l'avatar).
  menuTheirs: { left: t.spacing.lg + 28 + t.spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    height: ITEM_HEIGHT,
    paddingHorizontal: t.spacing.lg,
  },
  pressed: { backgroundColor: t.colors.surfaceMuted },
}));
