import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { listActivities } from '../api';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { makeTestClient, renderWithQuery, signInAs } from '@/test/mockApi';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
}));
jest.mock('../api', () => ({ listActivities: jest.fn() }));

describe('DiscoverScreen', () => {
  beforeEach(() => {
    const { client, me } = makeTestClient();
    signInAs(me);
    jest
      .mocked(listActivities)
      .mockImplementation((query) => client.request('activities.list', query));
  });

  it('salue par le prénom et affiche les sorties de Dakar', async () => {
    await renderWithQuery(<DiscoverScreen />);
    expect(screen.getByText('Salut Awa')).toBeOnTheScreen();
    expect(await screen.findByText('Ciné en plein air')).toBeOnTheScreen();
  });

  it('sans GPS : se rabat sur le quartier déclaré (Fann)', async () => {
    await renderWithQuery(<DiscoverScreen />);
    await waitFor(() => expect(listActivities).toHaveBeenCalled());
    expect(listActivities).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 14.693, lng: -17.463 }),
    );
  });

  it('« Gratuit » ne garde que les sorties gratuites', async () => {
    await renderWithQuery(<DiscoverScreen />);
    await screen.findByText('Ciné en plein air');
    await fireEvent.press(screen.getByRole('button', { name: 'Gratuit' }));
    await waitFor(() =>
      expect(listActivities).toHaveBeenLastCalledWith(expect.objectContaining({ freeOnly: true })),
    );
    await waitFor(() => expect(screen.queryByText('Soirée concert live')).toBeNull());
  });

  it('aucun résultat : état vide avec une action pour créer', async () => {
    jest.mocked(listActivities).mockResolvedValue({ items: [], nextCursor: null });
    await renderWithQuery(<DiscoverScreen />);
    expect(await screen.findByText('Aucune sortie pour ces filtres…')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Créer une activité' })).toBeOnTheScreen();
  });
});
