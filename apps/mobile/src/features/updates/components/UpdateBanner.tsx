import { ArrowsClockwise } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { X } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles, motion, useTheme } from '@/theme';
import { Text } from '@/ui';
import { useAppUpdate } from '../useAppUpdate';

// Nouvelle version téléchargée : bannière en haut, « Redémarrer » l'applique tout de suite.
// Fermée, elle ne revient pas avant le prochain lancement (la mise à jour s'appliquera alors seule).
export function UpdateBanner() {
  const { ready, restart } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  if (!ready || dismissed) return null;

  const onRestart = async () => {
    setRestarting(true);
    try {
      await restart();
    } catch {
      setRestarting(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(motion.base)}
      exiting={FadeOutUp.duration(motion.fast)}
      style={[styles.container, { top: insets.top + 8 }]}
    >
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.banner}>
        <ArrowsClockwise size={20} color={colors.onAction} weight="bold" />
        <Text variant="caption" style={styles.text}>
          {t('updates.ready')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: restarting, disabled: restarting }}
          disabled={restarting}
          onPress={onRestart}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text variant="caption" style={styles.actionLabel}>
            {t('updates.restart')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={10}
          onPress={() => setDismissed(true)}
        >
          <X size={18} color={colors.onAction} weight="bold" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { position: 'absolute', left: t.spacing.screen, right: t.spacing.screen, zIndex: 950 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.action,
  },
  text: { flex: 1, color: t.colors.onAction },
  action: {
    paddingVertical: t.spacing.xs,
    paddingHorizontal: t.spacing.sm,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.onAction,
  },
  actionLabel: { color: t.colors.action, fontWeight: '700' },
  pressed: { opacity: 0.8 },
}));
