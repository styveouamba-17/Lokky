import type { ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { Text, type TextColor } from './Text';

export type BadgeTone = 'free' | 'split' | 'trust' | 'accent' | 'neutral';

const TEXT_COLOR: Record<BadgeTone, TextColor> = {
  free: 'onSecondary',
  split: 'text',
  trust: 'success',
  accent: 'onAccent',
  neutral: 'text',
};

export function Badge({ label, tone, icon }: { label: string; tone: BadgeTone; icon?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={[styles.base, styles[tone]]}>
      {icon}
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
