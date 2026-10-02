import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { darkTheme, lightTheme } from '@/theme';
import { Text } from '../Text';

describe('Text', () => {
  it('applique la variante et la couleur du thème', async () => {
    await renderWithProviders(<Text variant="title">Salut</Text>);
    expect(screen.getByText('Salut')).toHaveStyle({
      fontSize: 24,
      color: lightTheme.colors.text,
    });
  });

  it('suit le mode sombre', async () => {
    await renderWithProviders(<Text color="textMuted">Salut</Text>, { preference: 'dark' });
    expect(screen.getByText('Salut')).toHaveStyle({ color: darkTheme.colors.textMuted });
  });

  it('plafonne l’agrandissement du texte à 1,3×', async () => {
    await renderWithProviders(<Text>Salut</Text>);
    expect(screen.getByText('Salut').props.maxFontSizeMultiplier).toBe(1.3);
  });
});
