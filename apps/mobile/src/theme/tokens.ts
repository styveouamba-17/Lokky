import type { TextStyle } from 'react-native';

// Couleurs brutes de la charte « Chaleur urbaine ». Les composants utilisent les tokens de themes.ts.
export const palette = {
  corniche: '#FF6B3D', // marque : logo, illustrations, décor — jamais du texte sur fond clair
  cornicheDeep: '#C8441C',
  ocean: '#00B4A6',
  oceanDeep: '#007F75',
  oceanLight: '#2DD4BF',
  soleil: '#FFC857',
  sable: '#FAF9F6',
  sableMuted: '#F3F1EC',
  white: '#FFFFFF',
  charbon: '#1F2937',
  charbonLight: '#2A3441',
  nuit: '#141A23',
  ivoire: '#F5F1EA',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  screen: 20,
} as const;

export const radius = { sm: 8, md: 12, lg: 20, full: 999 } as const;

export const fontFamilies = {
  fredokaMedium: 'Fredoka_500Medium',
  fredokaSemiBold: 'Fredoka_600SemiBold',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fontFamilies.fredokaSemiBold, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: fontFamilies.fredokaSemiBold, fontSize: 24, lineHeight: 32 },
  heading: { fontFamily: fontFamilies.fredokaMedium, fontSize: 20, lineHeight: 28 },
  body: { fontFamily: fontFamilies.interRegular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fontFamilies.interSemiBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fontFamilies.interSemiBold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fontFamilies.interMedium, fontSize: 13, lineHeight: 18 },
} as const satisfies Record<string, TextStyle>;

export const motion = { fast: 150, base: 200, slow: 250 } as const;
export const MAX_FONT_SCALE = 1.3;
