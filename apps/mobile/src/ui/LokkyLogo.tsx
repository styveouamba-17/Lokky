import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';
import { Text } from './Text';
import {
  LOGO_COLORS,
  LOGO_GAP,
  LOGO_SHAPES,
  LOGO_TILE_RADIUS,
  isPersonShape,
  type LogoShape,
} from './logo/geometry';

// Symbole « Coucher de Corniche » (spec §3) : soleil, trois silhouettes, deux vagues.
// La géométrie vit dans logo/geometry.ts, partagée avec les icônes natives et le splash.

export type LogoVariant = 'full' | 'symbol' | 'mono';

function Shape({ shape, ...props }: { shape: LogoShape } & Record<string, unknown>) {
  return shape.kind === 'circle' ? (
    <Circle cx={shape.cx} cy={shape.cy} r={shape.r} {...props} />
  ) : (
    <Path d={shape.d} {...props} />
  );
}

const gapProps = (color: string) => ({
  fill: color,
  stroke: color,
  strokeWidth: LOGO_GAP * 2,
  strokeLinejoin: 'round' as const,
});

// Couleurs : chaque forme est précédée d'un liseré couleur du fond (gapColor).
export function ColoredShapes({
  shapes,
  gapColor = LOGO_COLORS.tile,
}: {
  shapes: readonly LogoShape[];
  gapColor?: string;
}) {
  return shapes.map((shape, i) => (
    <G key={i}>
      <Shape shape={shape} {...gapProps(gapColor)} />
      <Shape shape={shape} fill={LOGO_COLORS[shape.fill]} />
    </G>
  ));
}

// Une seule couleur : le liseré de chaque forme est découpé dans celles du dessous.
function MonoShapes({
  shapes,
  color,
  idPrefix,
}: {
  shapes: readonly LogoShape[];
  color: string;
  idPrefix: string;
}) {
  return (
    <>
      <Defs>
        {shapes.map((_, i) => (
          <Mask
            key={i}
            id={`${idPrefix}-${i}`}
            maskUnits="userSpaceOnUse"
            x="-8"
            y="-8"
            width="80"
            height="80"
          >
            <Rect x="-8" y="-8" width="80" height="80" fill="#FFFFFF" />
            {shapes.slice(i + 1).map((above, j) => (
              <Shape key={j} shape={above} {...gapProps('#000000')} />
            ))}
          </Mask>
        ))}
      </Defs>
      {shapes.map((shape, i) => (
        <Shape key={i} shape={shape} fill={color} mask={`url(#${idPrefix}-${i})`} />
      ))}
    </>
  );
}

export function LokkyLogo({
  variant = 'full',
  size = 40,
  color,
  simplified = false,
}: {
  variant?: LogoVariant;
  size?: number;
  color?: string;
  simplified?: boolean; // très petites tailles : soleil + vagues, sans personnages
}) {
  const theme = useTheme();
  const idPrefix = `lokky-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const standalone = variant !== 'full';
  const shapes = simplified ? LOGO_SHAPES.filter((s) => !isPersonShape(s)) : LOGO_SHAPES;
  const people = shapes.filter(isPersonShape);
  const sun = shapes.filter((s) => s.fill === 'sun');
  const waves = shapes.filter((s) => s.fill === 'wave');

  const symbol =
    variant === 'mono' ? (
      <MonoShapes shapes={shapes} color={color ?? theme.colors.text} idPrefix={idPrefix} />
    ) : (
      <>
        <Rect width="64" height="64" rx={LOGO_TILE_RADIUS} fill={LOGO_COLORS.tile} />
        <ColoredShapes shapes={sun} />
        {people.length > 0 ? (
          <G testID="logo-people">
            <ColoredShapes shapes={people} />
          </G>
        ) : null}
        <ColoredShapes shapes={waves} />
      </>
    );

  const svg = (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessible={standalone}
      accessibilityLabel={standalone ? 'Lokky' : undefined}
    >
      {symbol}
    </Svg>
  );

  if (standalone) return svg;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Lokky"
      style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.2 }}
    >
      {svg}
      <Text
        variant="display"
        maxFontSizeMultiplier={1}
        style={{ fontSize: size * 0.75, lineHeight: size }}
      >
        Lokky
      </Text>
    </View>
  );
}
