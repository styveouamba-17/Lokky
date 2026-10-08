import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createQueryClient, setupFocusManager } from '@/api/queryClient';
import { connectSession, handleApiError } from '@/features/auth/sessionBridge';
import { configureForegroundNotifications } from '@/features/notifications/push';
import { i18n, useTranslation } from '@/i18n'; // charge aussi la configuration i18n
import { initMonitoring, navigationIntegration, wrapRoot } from '@/lib/monitoring';
import { useNetworkStore, watchNetwork } from '@/state/network';
import { usePreferencesStore } from '@/state/preferences';
import { useSessionStore } from '@/state/session';
import { ThemeProvider, useLokkyFonts, useTheme } from '@/theme';
import { AnimatedSplash, OfflineBanner, ToastProvider } from '@/ui';

initMonitoring();
configureForegroundNotifications();
SplashScreen.preventAutoHideAsync();
const queryClient = createQueryClient({ onError: (error) => void handleApiError(error) });
connectSession(queryClient);

// Garde de navigation : chaque groupe n'est accessible que dans le bon état de session.
// Quand l'état change (connexion, fin d'onboarding, déconnexion), expo-router redirige
// vers index, qui choisit la bonne destination.
function ThemedStack() {
  const theme = useTheme();
  const status = useSessionStore((s) => s.status);
  const online = useNetworkStore((s) => s.online);
  const { t } = useTranslation();
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
        {/* Au revoir après suppression du compte : visible quel que soit l'état de session. */}
        <Stack.Screen name="goodbye" options={{ gestureEnabled: false }} />
        {/* Pages légales : lisibles avant l'inscription comme après. */}
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'onboarding'}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="activity/[id]" />
          <Stack.Screen name="activity/[id]/edit" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="user/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="report" options={{ presentation: 'modal' }} />
          <Stack.Screen name="create" options={{ presentation: 'fullScreenModal' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'suspended' || status === 'banned'}>
          <Stack.Screen name="(moderation)" />
        </Stack.Protected>
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="dev/ui" />
        </Stack.Protected>
      </Stack>
      <OfflineBanner visible={!online} message={t('common.offline')} />
    </>
  );
}

function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  const fontsReady = useLokkyFonts();
  const sessionReady = useSessionStore((s) => s.status !== 'unknown');
  const hydrate = useSessionStore((s) => s.hydrate);
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const language = usePreferencesStore((s) => s.language);
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);
  const ready = fontsReady && sessionReady;

  useEffect(() => {
    if (navigationRef) navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);
  // Langue choisie (ou celle du téléphone au premier lancement) : tous les écrans suivent.
  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language]);
  useEffect(() => setupFocusManager(), []);
  useEffect(() => watchNetwork(), []);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  // Le splash animé est monté dans le même rendu : il prend le relais du natif sans saut.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider preference={themePreference}>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <ThemedStack />
              </ToastProvider>
              {splashDone ? null : <AnimatedSplash onFinish={finishSplash} />}
            </QueryClientProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Sentry entoure l'app : plantages et navigation suivis quand un DSN est configuré.
export default wrapRoot(RootLayout);
