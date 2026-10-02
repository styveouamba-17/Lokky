import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createQueryClient, setupFocusManager } from '@/api/queryClient';
import { usePreferencesStore } from '@/state/preferences';
import { ThemeProvider, useLokkyFonts, useTheme } from '@/theme';
import { ToastProvider } from '@/ui';

SplashScreen.preventAutoHideAsync();
const queryClient = createQueryClient();

function ThemedStack() {
  const theme = useTheme();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.bg);
  }, [theme]);
  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}
      />
    </>
  );
}

export default function RootLayout() {
  const fontsReady = useLokkyFonts();
  const themePreference = usePreferencesStore((s) => s.themePreference);

  useEffect(() => setupFocusManager(), []);
  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider preference={themePreference}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ThemedStack />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
