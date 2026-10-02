import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { MAX_FONT_SCALE, useTheme, type Theme, type ThemeColors } from '@/theme';

export type TextVariant = keyof Theme['typography'];
// Couleurs autorisées pour du texte : brand et les couleurs de fond en sont exclues.
export type TextColor = Exclude<
  keyof ThemeColors,
  'brand' | 'bg' | 'surface' | 'surfaceMuted' | 'border' | 'overlay' | 'accent'
>;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
