import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, type ThemePreference } from '@/theme';
import { ToastProvider } from '@/ui/Toast';

export function renderWithProviders(
  ui: ReactElement,
  { preference = 'light' }: { preference?: ThemePreference } = {},
) {
  return render(
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider preference={preference}>
        <ToastProvider>{ui}</ToastProvider>
      </ThemeProvider>
    </GestureHandlerRootView>,
  );
}
