import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { RouteErrorBoundary } from '../RouteErrorBoundary';

describe('RouteErrorBoundary', () => {
  it('affiche un écran d’erreur et permet de réessayer', async () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    await renderWithProviders(<RouteErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText('Oups, quelque chose a coincé')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalled();
  });
});
