import { fireEvent, screen } from '@testing-library/react-native';
import * as Updates from 'expo-updates';
import { renderWithProviders } from '@/test/render';
import { UpdateBanner } from '../components/UpdateBanner';

jest.mock('expo-updates', () => ({
  isEnabled: true,
  useUpdates: jest.fn(),
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(() => Promise.resolve()),
}));

const useUpdates = Updates.useUpdates as jest.Mock;

describe('UpdateBanner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reste cachée tant qu’aucune mise à jour n’est téléchargée', async () => {
    useUpdates.mockReturnValue({ isUpdatePending: false });
    await renderWithProviders(<UpdateBanner />);
    expect(screen.queryByText('Une nouvelle version de Lokky est prête.')).toBeNull();
  });

  it('« Redémarrer » applique la mise à jour', async () => {
    useUpdates.mockReturnValue({ isUpdatePending: true });
    await renderWithProviders(<UpdateBanner />);
    expect(screen.getByText('Une nouvelle version de Lokky est prête.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Redémarrer' }));
    expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);
  });

  it('se ferme sans redémarrer', async () => {
    useUpdates.mockReturnValue({ isUpdatePending: true });
    await renderWithProviders(<UpdateBanner />);
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByText('Une nouvelle version de Lokky est prête.')).toBeNull();
    expect(Updates.reloadAsync).not.toHaveBeenCalled();
  });
});
