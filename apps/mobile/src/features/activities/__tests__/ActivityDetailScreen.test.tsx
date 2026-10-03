import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
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
    jest.clearAllMocks();
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

  it('« Qui vient ? » et le créateur ouvrent les profils', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_foot" />);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Voir le profil de Ibrahima' }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/user/[id]',
      params: { id: 'u_ibrahima' },
    });
    await fireEvent.press(screen.getByRole('button', { name: /^Organisé par Moussa/ }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/user/[id]',
      params: { id: 'u_moussa' },
    });
  });

  it('sortie passée : on peut laisser un avis depuis le détail', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_footing" />);
    expect(await screen.findByRole('button', { name: 'Laisser un avis' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Discuter avec le groupe' })).toBeOnTheScreen();
  });

  it('« Je viens ! » : tout de suite « Tu y vas », puis confirmé', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_cine" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Je viens !' }));
    expect(await screen.findByText('Tu y vas !')).toBeOnTheScreen();
    expect(await screen.findByText('C’est noté, à tout à l’heure !')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Je ne viens plus' })).toBeOnTheScreen();
  });

  it('après « Je viens ! », on peut ouvrir le chat du groupe', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_cine" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Je viens !' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Discuter avec le groupe' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/chat/[id]',
      params: { id: 'c_a_cine' },
    });
  });

  it('le créateur accède au chat de sa sortie', async () => {
    await renderWithQuery(<ActivityDetailScreen id="a_thieb" />);
    expect(
      await screen.findByRole('button', { name: 'Discuter avec le groupe' }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Je viens !' })).toBeNull();
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
