import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton
            accessibilityLabel="Retour"
            onPress={onBack}
            icon={<ArrowLeft size={24} color={colors.text} weight="bold" />}
          />
        ) : null}
      </View>
      <Text variant="heading" accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing.sm,
  },
  side: { width: 48 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
}));
