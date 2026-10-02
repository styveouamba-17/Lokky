import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider, type ThemePreference } from '@/theme';
import { ToastProvider } from '@/ui/Toast';

export function renderWithProviders(
  ui: ReactElement,
  { preference = 'light' }: { preference?: ThemePreference } = {},
) {
  return render(
    <ThemeProvider preference={preference}>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
  );
}
