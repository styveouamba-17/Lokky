import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from './themes';

export type ThemePreference = 'system' | 'light' | 'dark';

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
  preference = 'system',
  children,
}: {
  preference?: ThemePreference;
  children: ReactNode;
}) {
  const system = useColorScheme(); // peut valoir 'unspecified' depuis RN 0.83
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  return (
    <ThemeContext.Provider value={scheme === 'dark' ? darkTheme : lightTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme doit être utilisé à l’intérieur de <ThemeProvider>.');
  return theme;
}
