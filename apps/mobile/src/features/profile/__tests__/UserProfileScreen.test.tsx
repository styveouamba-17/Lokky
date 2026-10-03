import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { makeTestClient, renderWithQuery, signInAs } from '@/test/mockApi';
import { blockUser, getUser, listUserActivities, openDirect, unblockUser } from '../api';
import { UserProfileScreen } from '../screens/UserProfileScreen';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() },
}));
jest.mock('../api', () => ({
  getUser: jest.fn(),
  listUserActivities: jest.fn(),
  openDirect: jest.fn(),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
}));

describe('UserProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { client, me } = makeTestClient();
    signInAs(me);
    jest.mocked(getUser).mockImplementation((id) => client.request('users.get', { id }));
    jest
      .mocked(listUserActivities)
      .mockImplementation((id) => client.request('users.activities', { id }));
    jest
      .mocked(openDirect)
      .mockImplementation((userId) => client.request('conversations.openDirect', { userId }));
    jest
      .mocked(blockUser)
      .mockImplementation((userId) => client.request('blocks.create', { userId }));
    jest
      .mocked(unblockUser)
      .mockImplementation((userId) => client.request('blocks.delete', { userId }));
  });

  it('montre l’identité, la confiance, les envies et ses prochaines sorties', async () => {
    await renderWithQuery(<UserProfileScreen id="u_cheikh" />);
    expect(await screen.findByRole('header', { name: 'Cheikh' })).toBeOnTheScreen();
    expect(screen.getByText('Étudiant·e · Médina')).toBeOnTheScreen();
    expect(screen.getByText('Créateur fiable')).toBeOnTheScreen();
    expect(screen.getByLabelText('Présence : 90 %')).toBeOnTheScreen();
    expect(screen.getByText('4,9 (40 avis)')).toBeOnTheScreen();
    expect(await screen.findByText('Thé et jeux de société')).toBeOnTheScreen();
  });

  it('une sortie ouvre son détail', async () => {
    await renderWithQuery(<UserProfileScreen id="u_cheikh" />);
    await fireEvent.press(await screen.findByRole('button', { name: /Soirée concert live/ }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/activity/[id]',
      params: { id: 'a_concert' },
    });
  });

  it('nouveau membre : « Nouveau » plutôt que 0 %, et pas de note', async () => {
    await renderWithQuery(<UserProfileScreen id="u_ibrahima" />);
    expect(await screen.findByLabelText('Présence : Nouveau')).toBeOnTheScreen();
    expect(screen.queryByText(/avis\)/)).toBeNull();
    expect(await screen.findByText('Aucune sortie prévue pour le moment.')).toBeOnTheScreen();
  });

  it('profil introuvable', async () => {
    await renderWithQuery(<UserProfileScreen id="u_inconnu" />);
    expect(await screen.findByText('Ce profil n’est plus disponible.')).toBeOnTheScreen();
  });

  it('« Écrire » ouvre la conversation privée après une sortie partagée', async () => {
    await renderWithQuery(<UserProfileScreen id="u_ousmane" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Écrire' }));
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/chat/[id]',
        params: { id: 'd_u_awa__u_ousmane' },
      }),
    );
  });

  it('sans sortie partagée : explique pourquoi on ne peut pas encore écrire', async () => {
    await renderWithQuery(<UserProfileScreen id="u_cheikh" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Écrire' }));
    expect(await screen.findByText('Pas encore possible')).toBeOnTheScreen();
    expect(openDirect).not.toHaveBeenCalled();
  });

  it('bloquer depuis le menu, avec confirmation', async () => {
    await renderWithQuery(<UserProfileScreen id="u_moussa" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Plus d’options' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Bloquer' }));
    expect(screen.getByText('Bloquer Moussa ?')).toBeOnTheScreen();
    const confirm = screen.getAllByRole('button', { name: 'Bloquer' }).at(-1)!;
    await fireEvent.press(confirm);

    expect(await screen.findByText('Moussa est bloqué·e.')).toBeOnTheScreen();
    expect(blockUser).toHaveBeenCalledWith('u_moussa');
    expect(await screen.findByText(/Tu as bloqué Moussa/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Écrire' })).toBeNull();
  });

  it('signaler ouvre le formulaire de signalement', async () => {
    await renderWithQuery(<UserProfileScreen id="u_moussa" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Plus d’options' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Signaler' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/report',
      params: { targetType: 'user', targetId: 'u_moussa' },
    });
  });
});
