import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';
import { palette, useTheme } from '@/theme';
import { Text } from './Text';

// Symbole « Coucher de Corniche » simplifié (spec §3) : demi-soleil, trois silhouettes
// découpées dans le soleil (masque), une seule vague épaisse. viewBox 64 × 64.
const SUN = 'M8 38 A24 24 0 0 1 56 38 Z';
const WAVE = 'M8 47 C 16 41.5, 24 41.5, 32 47 S 48 52.5, 56 47';
const HEADS = [
  { cx: 18.5, cy: 27, r: 3.2 },
  { cx: 32, cy: 25, r: 3.8 },
  { cx: 45.5, cy: 27, r: 3.2 },
];
const SHOULDERS = [
  'M13.5 38 A5 5 0 0 1 23.5 38 Z',
  'M26 38 A6 6 0 0 1 38 38 Z',
  'M40.5 38 A5 5 0 0 1 50.5 38 Z',
];

export type LogoVariant = 'full' | 'symbol' | 'mono';

export function LokkyLogo({
  variant = 'full',
  size = 40,
  color,
  simplified = false,
}: {
  variant?: LogoVariant;
  size?: number;
  color?: string;
  simplified?: boolean; // très petites tailles : soleil + vague, sans personnages
}) {
  const theme = useTheme();
  const maskId = `lokky-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const mono = variant === 'mono';
  const sunColor = mono ? (color ?? theme.colors.text) : palette.corniche;
  const waveColor = mono ? sunColor : palette.ocean;
  const standalone = variant !== 'full';

  const symbol = (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessible={standalone}
      accessibilityLabel={standalone ? 'Lokky' : undefined}
    >
      <Defs>
        <Mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <Rect width="64" height="64" fill="#FFFFFF" />
          {simplified ? null : (
            <G testID="logo-people" fill="#000000">
              {HEADS.map((h) => (
                <Circle key={`${h.cx}`} cx={h.cx} cy={h.cy} r={h.r} />
              ))}
              {SHOULDERS.map((d) => (
                <Path key={d} d={d} />
              ))}
            </G>
          )}
        </Mask>
      </Defs>
      <Path d={SUN} fill={sunColor} mask={`url(#${maskId})`} />
      <Path d={WAVE} stroke={waveColor} strokeWidth={5} strokeLinecap="round" fill="none" />
    </Svg>
  );

  if (standalone) return symbol;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Lokky"
      style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.15 }}
    >
      {symbol}
      <Text
        variant="display"
        maxFontSizeMultiplier={1}
        style={{ fontSize: size * 0.8, lineHeight: size }}
      >
        Lokky
      </Text>
    </View>
  );
}
