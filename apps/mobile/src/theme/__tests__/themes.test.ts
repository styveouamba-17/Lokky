import { contrastRatio } from '../contrast';
import { darkTheme, lightTheme, type ThemeColors } from '../themes';

type Pair = [foreground: keyof ThemeColors, background: keyof ThemeColors];

// Toutes les combinaisons texte / fond utilisées par le design system.
const TEXT_PAIRS: Pair[] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'surfaceMuted'],
  ['textMuted', 'bg'],
  ['textMuted', 'surface'],
  ['action', 'bg'],
  ['action', 'surface'],
  ['onAction', 'action'],
  ['onAction', 'danger'],
  ['onSecondary', 'secondary'],
  ['onAccent', 'accent'],
  ['secondary', 'bg'],
  ['secondary', 'surface'],
  ['success', 'bg'],
  ['success', 'surface'],
  ['danger', 'bg'],
  ['danger', 'surface'],
  ['warning', 'bg'],
  ['warning', 'surface'],
  ['bg', 'text'], // toasts : texte clair sur fond foncé (inversé en mode sombre)
];

describe.each([
  ['clair', lightTheme],
  ['sombre', darkTheme],
])('thème %s', (_name, theme) => {
  it.each(TEXT_PAIRS)('%s sur %s respecte WCAG AA (≥ 4,5:1)', (fg, bg) => {
    expect(contrastRatio(theme.colors[fg], theme.colors[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('contrastRatio', () => {
  it('vaut 21 pour noir sur blanc et 1 pour une couleur sur elle-même', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FF6B3D', '#FF6B3D')).toBeCloseTo(1, 5);
  });
  it('confirme que l’orange de marque ne peut pas servir de texte sur fond clair', () => {
    expect(contrastRatio('#FF6B3D', lightTheme.colors.bg)).toBeLessThan(4.5);
  });
});
