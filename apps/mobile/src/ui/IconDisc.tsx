import { View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import type { IconComponent } from './icons';

// Grande icône dans une pastille : visuel des états vides en attendant les illustrations.
export function IconDisc({ icon: Icon, size = 96 }: { icon: IconComponent; size?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View
      style={[styles.disc, { width: size, height: size }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Icon size={size * 0.5} color={colors.action} weight="duotone" />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.full,
    backgroundColor: t.colors.surfaceMuted,
  },
}));
