import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { getActivity, getParticipants, joinActivity, leaveActivity } from '../api';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { makeTestClient, renderWithQuery, signInAs } from '@/test/mockApi';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('../api', () => ({
  getActivity: jest.fn(),
  getParticipants: jest.fn(),
  joinActivity: jest.fn(),
  leaveActivity: jest.fn(),
}));

describe('ActivityDetailScreen', () => {
  beforeEach(() => {
    const { client, me } = makeTestClient();
    signInAs(me);
    jest.mocked(getActivity).mockImplementation((id) => client.request('activities.get', { id }));
    jest
      .mocked(getParticipants)
      .mockImplementation((id) => client.request('activities.participants', { id }));
    jest.mocked(joinActivity).mockImplementation((id) => client.request('activities.join', { id }));
    jest
      .mocked(leaveActivity)
      .mockImplementation((id) => client.request('activities.leave', { id }));
  });

  it('montre quand, où, le coût, qui vient et le créateur', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_foot" />);
    expect(await screen.findByRole('header', { name: 'Foot à la plage' })).toBeOnTheScreen();
    expect(screen.getByText('Quand ?')).toBeOnTheScreen();
    expect(screen.getByText('Organisé par')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Ouvrir dans Maps' })).toBeOnTheScreen();
    // Moussa organise et participe : il apparaît dans « Qui vient ? » et sur la carte du créateur.
    expect(await screen.findAllByText('Moussa')).toHaveLength(2);
  });

  it('« Je viens ! » : tout de suite « Tu y vas », puis confirmé', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_cine" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Je viens !' }));
    expect(await screen.findByText('Tu y vas !')).toBeOnTheScreen();
    expect(await screen.findByText('C’est noté, à tout à l’heure !')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Je ne viens plus' })).toBeOnTheScreen();
  });

  it('refus du serveur : retour en arrière et message clair', async () => {
    jest
      .mocked(joinActivity)
      .mockRejectedValue(new ApiError('activity_full', 'Activité complète.', 409));
    await renderWithQuery(<ActivityDetailScreen id="a_cine" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Je viens !' }));
    expect(await screen.findByText('Trop tard, la sortie est complète.')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByText('Tu y vas !')).toBeNull());
  });

  it('activité complète : bouton « Complet » désactivé', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_concert" />);
    expect(await screen.findByRole('button', { name: 'Complet' })).toBeDisabled();
  });

  it('sortie introuvable : message et retour', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_inconnue" />);
    expect(await screen.findByText('Cette sortie n’existe plus.')).toBeOnTheScreen();
  });
});
