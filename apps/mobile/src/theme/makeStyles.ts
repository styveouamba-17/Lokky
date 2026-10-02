import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import { darkTheme, lightTheme, type Theme } from './themes';

// Crée les deux feuilles de style (claire et sombre) une seule fois, au chargement du module.
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  const sheets = {
    light: StyleSheet.create(factory(lightTheme)),
    dark: StyleSheet.create(factory(darkTheme)),
  };
  return function useStyles(): T {
    return sheets[useTheme().scheme];
  };
}
