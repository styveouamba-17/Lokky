import { WifiSlash } from 'phosphor-react-native/src/icons/WifiSlash';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, motion, useTheme } from '@/theme';
import { Text } from './Text';

// Bannière hors-ligne (spec §7.5) : posée en bas, au-dessus de la barre d'onglets.
export function OfflineBanner({ visible, message }: { visible: boolean; message: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.base)}
      exiting={FadeOutDown.duration(motion.fast)}
      pointerEvents="none"
      style={[styles.container, { bottom: insets.bottom + 64 }]}
    >
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={styles.banner}
      >
        <WifiSlash size={18} color={colors.bg} weight="bold" />
        <Text variant="caption" style={styles.text}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { position: 'absolute', left: t.spacing.screen, right: t.spacing.screen, zIndex: 900 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.text,
  },
  text: { flex: 1, color: t.colors.bg },
}));
