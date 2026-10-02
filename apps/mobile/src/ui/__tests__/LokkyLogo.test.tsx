import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { LokkyLogo } from '../LokkyLogo';

describe('LokkyLogo', () => {
  it('version complète : symbole + nom, annoncée « Lokky »', async () => {
    await renderWithProviders(<LokkyLogo />);
    expect(screen.getByLabelText('Lokky')).toBeOnTheScreen();
    expect(screen.getByText('Lokky')).toBeOnTheScreen();
  });

  it('version symbole seule : pas de nom écrit', async () => {
    await renderWithProviders(<LokkyLogo variant="symbol" />);
    expect(screen.queryByText('Lokky')).toBeNull();
  });

  it('version simplifiée : sans les personnages', async () => {
    await renderWithProviders(<LokkyLogo variant="symbol" simplified />);
    expect(screen.queryByTestId('logo-people', { includeHiddenElements: true })).toBeNull();
  });

  it('version complète : avec les personnages', async () => {
    await renderWithProviders(<LokkyLogo variant="symbol" />);
    expect(screen.getByTestId('logo-people', { includeHiddenElements: true })).toBeTruthy();
  });
});
