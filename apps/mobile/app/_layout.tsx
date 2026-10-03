import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createQueryClient, setupFocusManager } from '@/api/queryClient';
import '@/i18n';
import { connectSession, handleApiError } from '@/features/auth/sessionBridge';
import { usePreferencesStore } from '@/state/preferences';
import { useSessionStore } from '@/state/session';
import { ThemeProvider, useLokkyFonts, useTheme } from '@/theme';
import { AnimatedSplash, ToastProvider } from '@/ui';

SplashScreen.preventAutoHideAsync();
const queryClient = createQueryClient({ onError: (error) => void handleApiError(error) });
connectSession(queryClient);

// Garde de navigation : chaque groupe n'est accessible que dans le bon état de session.
// Quand l'état change (connexion, fin d'onboarding, déconnexion), expo-router redirige
// vers index, qui choisit la bonne destination.
function ThemedStack() {
  const theme = useTheme();
  const status = useSessionStore((s) => s.status);
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.bg);
  }, [theme]);
  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'onboarding'}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="activity/[id]" />
          <Stack.Screen name="create" options={{ presentation: 'fullScreenModal' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'suspended' || status === 'banned'}>
          <Stack.Screen name="(moderation)" />
        </Stack.Protected>
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="dev/ui" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const fontsReady = useLokkyFonts();
  const sessionReady = useSessionStore((s) => s.status !== 'unknown');
  const hydrate = useSessionStore((s) => s.hydrate);
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);
  const ready = fontsReady && sessionReady;

  useEffect(() => setupFocusManager(), []);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  // Le splash animé est monté dans le même rendu : il prend le relais du natif sans saut.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider preference={themePreference}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ThemedStack />
          </ToastProvider>
          {splashDone ? null : <AnimatedSplash onFinish={finishSplash} />}
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
