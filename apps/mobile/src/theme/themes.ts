import { palette, radius, spacing, typography } from './tokens';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  brand: string;
  action: string;
  onAction: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  onAccent: string;
  success: string;
  danger: string;
  warning: string;
  overlay: string;
}

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadow: { card: string | null }; // null : on utilise une bordure à la place
}

export const lightTheme: Theme = {
  scheme: 'light',
  colors: {
    bg: palette.sable,
    surface: palette.white,
    surfaceMuted: palette.sableMuted,
    text: palette.charbon,
    textMuted: '#6B7280',
    border: '#E5E7EB',
    brand: palette.corniche,
    action: palette.cornicheDeep,
    onAction: palette.white,
    secondary: palette.oceanDeep,
    onSecondary: palette.white,
    accent: palette.soleil,
    onAccent: palette.charbon,
    success: '#15803D',
    danger: '#DC2626',
    warning: '#B45309',
    overlay: 'rgba(20, 26, 35, 0.55)',
  },
  spacing,
  radius,
  typography,
  shadow: { card: '0px 2px 10px rgba(31, 41, 55, 0.08)' },
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: {
    bg: palette.nuit,
    surface: palette.charbon,
    surfaceMuted: palette.charbonLight,
    text: palette.ivoire,
    textMuted: '#9CA3AF',
    border: '#2D3748',
    brand: palette.corniche,
    action: palette.corniche,
    onAction: palette.charbon,
    secondary: palette.oceanLight,
    onSecondary: palette.nuit,
    accent: palette.soleil,
    onAccent: palette.charbon,
    success: '#4ADE80',
    danger: '#F87171',
    warning: '#FBBF24',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  spacing,
  radius,
  typography,
  shadow: { card: null },
};
