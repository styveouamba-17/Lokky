import { View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import type { IconComponent } from './icons';
import { Text, type TextColor } from './Text';

export type BadgeTone = 'free' | 'split' | 'trust' | 'accent' | 'neutral';

const TEXT_COLOR: Record<BadgeTone, TextColor> = {
  free: 'onSecondary',
  split: 'text',
  trust: 'success',
  accent: 'onAccent',
  neutral: 'text',
};

export function Badge({
  label,
  tone,
  icon: Icon,
}: {
  label: string;
  tone: BadgeTone;
  icon?: IconComponent;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.base, styles[tone]]}>
      {Icon ? <Icon size={14} color={colors[TEXT_COLOR[tone]]} weight="fill" /> : null}
      <Text variant="caption" color={TEXT_COLOR[tone]}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: 2,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  free: { backgroundColor: t.colors.secondary },
  split: { backgroundColor: t.colors.surfaceMuted },
  trust: { backgroundColor: t.colors.surface, borderColor: t.colors.success },
  accent: { backgroundColor: t.colors.accent },
  neutral: { backgroundColor: t.colors.surfaceMuted },
}));
