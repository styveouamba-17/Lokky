import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { makeStyles } from '../makeStyles';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { darkTheme, lightTheme } from '../themes';

function Probe() {
  const theme = useTheme();
  return <Text>{theme.scheme}</Text>;
}

const useProbeStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.bg } }));
const seen: object[] = [];
function StyleProbe() {
  const styles = useProbeStyles();
  seen.push(styles);
  return <Text style={styles.box}>style</Text>;
}

describe('ThemeProvider', () => {
  it('applique la préférence explicite', async () => {
    await render(
      <ThemeProvider preference="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('dark')).toBeOnTheScreen();
  });

  it('suit le système par défaut (clair dans Jest)', async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('light')).toBeOnTheScreen();
  });

  it('échoue clairement hors du fournisseur', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow(/ThemeProvider/);
    jest.restoreAllMocks();
  });
});

describe('makeStyles', () => {
  it('réutilise la même feuille de style d’un rendu à l’autre, une par thème', async () => {
    seen.length = 0;
    const { rerender } = await render(
      <ThemeProvider preference="light">
        <StyleProbe />
      </ThemeProvider>,
    );
    await rerender(
      <ThemeProvider preference="light">
        <StyleProbe />
      </ThemeProvider>,
    );
    expect(seen[0]).toBe(seen[1]);
    expect(screen.getByText('style')).toHaveStyle({ backgroundColor: lightTheme.colors.bg });

    await rerender(
      <ThemeProvider preference="dark">
        <StyleProbe />
      </ThemeProvider>,
    );
    expect(screen.getByText('style')).toHaveStyle({ backgroundColor: darkTheme.colors.bg });
  });
});
