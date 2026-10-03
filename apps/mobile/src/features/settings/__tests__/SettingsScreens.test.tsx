import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useSessionStore } from '@/state/session';
import { makeTestClient, renderWithQuery, signInAs } from '@/test/mockApi';
import { deleteAccount, listBlocks, unblockUser, updateMe } from '../api';
import { BlockedScreen } from '../screens/BlockedScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
}));
jest.mock('../api', () => ({
  updateMe: jest.fn(),
  listBlocks: jest.fn(),
  unblockUser: jest.fn(),
  deleteAccount: jest.fn(),
}));

let client: ReturnType<typeof makeTestClient>['client'];

describe('Réglages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const test = makeTestClient();
    client = test.client;
    signInAs(test.me);
    jest.mocked(updateMe).mockImplementation((changes) => client.request('me.update', changes));
    jest.mocked(listBlocks).mockImplementation(() => client.request('blocks.list', {}));
    jest
      .mocked(unblockUser)
      .mockImplementation((userId) => client.request('blocks.delete', { userId }));
    jest.mocked(deleteAccount).mockImplementation(() => client.request('me.delete', {}));
  });

  it('notifications : couper les messages, enregistré sur le compte', async () => {
    await renderWithQuery(<NotificationsScreen />);
    const messages = screen.getByRole('switch', { name: 'Messages' });
    expect(messages).toBeChecked();
    await fireEvent(messages, 'valueChange', false);
    await waitFor(() =>
      expect(useSessionStore.getState().me?.preferences.notifications.messages).toBe(false),
    );
    expect(updateMe).toHaveBeenCalledWith({
      preferences: expect.objectContaining({
        notifications: { messages: false, activityUpdates: true, reminders: true },
      }),
    });
  });

  it('personnes bloquées : la liste, puis débloquer', async () => {
    await client.request('blocks.create', { userId: 'u_moussa' });
    await renderWithQuery(<BlockedScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Débloquer' }));
    expect(await screen.findByText('Moussa est débloqué·e.')).toBeOnTheScreen();
    expect(await screen.findByText('Personne n’est bloqué')).toBeOnTheScreen();
  });

  it('déconnexion : demande confirmation, annuler ne déconnecte pas', async () => {
    await renderWithQuery(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(screen.getByText('Se déconnecter ?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Annuler' }));
    expect(useSessionStore.getState().status).toBe('signedIn');

    await fireEvent.press(screen.getByRole('button', { name: 'Se déconnecter' }));
    await fireEvent.press(screen.getAllByRole('button', { name: 'Se déconnecter' }).at(-1)!);
    await waitFor(() => expect(useSessionStore.getState().status).toBe('signedOut'));
  });

  it('suppression du compte : confirmer en tapant le mot, puis au revoir', async () => {
    await renderWithQuery(<DeleteAccountScreen />);
    const submit = screen.getByRole('button', { name: 'Supprimer définitivement' });
    expect(submit).toBeDisabled();
    await fireEvent.changeText(
      screen.getByLabelText('Pour confirmer, écris SUPPRIMER'),
      'supprimer',
    );
    await fireEvent.press(submit);
    await waitFor(() => expect(useSessionStore.getState().status).toBe('signedOut'));
    expect(router.replace).toHaveBeenCalledWith('/goodbye');
  });
});
