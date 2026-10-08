import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useNetworkStore } from '@/state/network';
import { makeTestClient, renderWithQuery, signInAs, TEST_NOW } from '@/test/mockApi';
import {
  cancelGroupActivity,
  getConversation,
  getGroupActivity,
  getGroupParticipants,
  listMessages,
  markConversationRead,
  removeGroupParticipant,
  sendMessage,
  updateMessage,
} from '../api';
import { useOutbox } from '../outbox';
import { ChatScreen } from '../screens/ChatScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../api', () => ({
  cancelGroupActivity: jest.fn(),
  getConversation: jest.fn(),
  getGroupActivity: jest.fn(),
  getGroupParticipants: jest.fn(),
  listMessages: jest.fn(),
  markConversationRead: jest.fn(),
  removeGroupParticipant: jest.fn(),
  sendMessage: jest.fn(),
  updateMessage: jest.fn(),
}));

let client: ReturnType<typeof makeTestClient>['client'];

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const test = makeTestClient();
    client = test.client;
    signInAs(test.me);
    useOutbox.setState({ items: [] });
    useNetworkStore.setState({ online: true });
    jest
      .mocked(getConversation)
      .mockImplementation((id) => client.request('conversations.get', { id }));
    jest
      .mocked(getGroupActivity)
      .mockImplementation((id) => client.request('activities.get', { id }));
    jest
      .mocked(listMessages)
      .mockImplementation((conversationId, cursor) =>
        client.request('messages.list', { conversationId, cursor }),
      );
    jest
      .mocked(markConversationRead)
      .mockImplementation((id) => client.request('conversations.markRead', { id }));
    jest.mocked(sendMessage).mockImplementation((input) => client.request('messages.send', input));
    jest
      .mocked(updateMessage)
      .mockImplementation((input) => client.request('messages.update', input));
    jest
      .mocked(getGroupParticipants)
      .mockImplementation((id) => client.request('activities.participants', { id }));
    jest
      .mocked(removeGroupParticipant)
      .mockImplementation((id, userId) =>
        client.request('activities.removeParticipant', { id, userId }),
      );
    jest
      .mocked(cancelGroupActivity)
      .mockImplementation((id) => client.request('activities.cancel', { id }));
  });

  it('affiche la sortie, le RDV épinglé, les messages et les messages système', async () => {
    await renderWithQuery(<ChatScreen id="c_a_mamelles" />);
    expect(
      await screen.findByRole('header', { name: 'Coucher de soleil aux Mamelles' }),
    ).toBeOnTheScreen();
    expect(await screen.findByText('Phare des Mamelles · Parking du phare')).toBeOnTheScreen();
    expect(screen.getByTestId('activity-group-avatar')).toBeOnTheScreen();
    expect(
      await screen.findByText('Moi je pars de Yoff, je vous retrouve au parking'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Moussa a rejoint le groupe')).toBeOnTheScreen();
    await waitFor(() => expect(markConversationRead).toHaveBeenCalledWith('c_a_mamelles'));
  });

  it('le RDV épinglé ouvre la sortie', async () => {
    await renderWithQuery(<ChatScreen id="c_a_mamelles" />);
    await fireEvent.press(await screen.findByRole('button', { name: /Rendez-vous/ }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/activity/[id]',
      params: { id: 'a_mamelles' },
    });
  });

  it('affiche le statut annulé de l’activité dans la discussion', async () => {
    const activity = await client.request('activities.get', { id: 'a_mamelles' });
    jest.mocked(getGroupActivity).mockResolvedValue({ ...activity, status: 'cancelled' });

    await renderWithQuery(<ChatScreen id="c_a_mamelles" />);

    expect(await screen.findByText('Annulée')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Annulée/ })).toBeOnTheScreen();
  });

  it('charge les anciens messages seulement à la demande, une page à la fois', async () => {
    const firstPage = await client.request('messages.list', { conversationId: 'c_a_bu' });
    jest
      .mocked(listMessages)
      .mockImplementation(async (_conversationId, cursor) =>
        cursor ? { items: [], nextCursor: null } : { ...firstPage, nextCursor: 'older-page' },
      );

    await renderWithQuery(<ChatScreen id="c_a_bu" />);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Charger les messages précédents' }),
    );

    await waitFor(() => expect(listMessages).toHaveBeenCalledWith('c_a_bu', 'older-page'));
    expect(screen.queryByRole('button', { name: 'Charger les messages précédents' })).toBeNull();
  });

  it('charge l’ancien message cité puis y saute', async () => {
    const firstPage = await client.request('messages.list', { conversationId: 'c_a_bu' });
    const [newer, older] = firstPage.items;
    if (!newer || !older) throw new Error('Expected at least two seeded messages');
    jest.mocked(listMessages).mockImplementation(async (_conversationId, cursor) =>
      cursor
        ? { items: [older], nextCursor: null }
        : {
            items: [
              {
                ...newer,
                replyTo: { id: older.id, body: older.body, sender: older.sender },
              },
            ],
            nextCursor: 'older-page',
          },
    );

    await renderWithQuery(<ChatScreen id="c_a_bu" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Aller au message cité' }));

    await waitFor(() => expect(listMessages).toHaveBeenCalledWith('c_a_bu', 'older-page'));
    expect((await screen.findAllByText(older.body)).length).toBeGreaterThan(1);
  });

  it('le créateur peut ouvrir l’édition et retirer un participant', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });
    await renderWithQuery(<ChatScreen id="c_a_thieb" />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Organisation de la sortie' }));
    const edit = await screen.findByRole('button', { name: 'Modifier l’activité' });
    expect(screen.getByRole('button', { name: 'Annuler l’activité' })).toBeOnTheScreen();
    await fireEvent.press(edit);
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/activity/[id]/edit',
      params: { id: 'a_thieb' },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Organisation de la sortie' }));
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Retirer Fatou de l’activité' }),
    );
    await waitFor(() => expect(removeGroupParticipant).toHaveBeenCalledWith('a_thieb', 'u_fatou'));
    expect(await screen.findByText('Le participant a été retiré de l’activité.')).toBeOnTheScreen();
    alert.mockRestore();
  });

  it('envoie un message : il s’affiche tout de suite, puis est confirmé', async () => {
    await renderWithQuery(<ChatScreen id="c_a_bu" />);
    await fireEvent.changeText(
      await screen.findByLabelText('Ton message'),
      'On se retrouve à 9h50 ?',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    expect(await screen.findByText('On se retrouve à 9h50 ?')).toBeOnTheScreen();
    await waitFor(() => expect(useOutbox.getState().items).toHaveLength(0));
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'c_a_bu', body: 'On se retrouve à 9h50 ?' }),
    );
    expect(screen.getByLabelText('Ton message')).toHaveDisplayValue('');
  });

  it('répond à un message précis avec le geste de réponse accessible', async () => {
    await renderWithQuery(<ChatScreen id="c_a_bu" />);
    await fireEvent(
      await screen.findByText('Hello Awa ! Tu révises quelle matière ?'),
      'accessibilityAction',
      { nativeEvent: { actionName: 'reply' } },
    );
    await fireEvent.changeText(
      await screen.findByLabelText('Ton message'),
      'On se retrouve demain ?',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'c_a_bu',
          body: 'On se retrouve demain ?',
          replyToMessageId: expect.any(String),
        }),
      ),
    );
    expect(
      (await screen.findAllByText('Hello Awa ! Tu révises quelle matière ?')).length,
    ).toBeGreaterThan(1);
  });

  it('modifie son propre message déjà envoyé et affiche le statut modifié', async () => {
    let action = 'Modifier';
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === action)?.onPress?.();
    });
    await renderWithQuery(<ChatScreen id="c_a_bu" />);
    await fireEvent(await screen.findByText('Droit constitutionnel, et toi ?'), 'longPress');
    const input = await screen.findByLabelText('Ton message');
    expect(input).toHaveDisplayValue('Droit constitutionnel, et toi ?');
    await fireEvent.changeText(input, 'Droit constitutionnel, rendez-vous demain.');
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(updateMessage).toHaveBeenCalledWith({
        id: expect.any(String),
        body: 'Droit constitutionnel, rendez-vous demain.',
      }),
    );
    expect(await screen.findByText('Droit constitutionnel, rendez-vous demain.')).toBeOnTheScreen();
    alert.mockRestore();
  });

  it('hors ligne : le message attend le réseau, puis part à la reconnexion', async () => {
    useNetworkStore.setState({ online: false });
    await renderWithQuery(<ChatScreen id="c_a_bu" />);
    await fireEvent.changeText(await screen.findByLabelText('Ton message'), 'Je suis dans le bus');
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    expect(await screen.findByText('En attente de réseau')).toBeOnTheScreen();
    expect(sendMessage).not.toHaveBeenCalled();

    // Retour du réseau : le prochain envoi repart avec toute la file, dans l'ordre.
    useNetworkStore.setState({ online: true });
    await fireEvent.changeText(screen.getByLabelText('Ton message'), 'J’arrive');
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));
    expect(jest.mocked(sendMessage).mock.calls.map(([input]) => input.body)).toEqual([
      'Je suis dans le bus',
      'J’arrive',
    ]);
    await waitFor(() => expect(screen.queryByText('En attente de réseau')).toBeNull());
    expect(screen.getByText('Je suis dans le bus')).toBeOnTheScreen();
  });

  it('chat sans message : invite à briser la glace', async () => {
    const created = await client.request('activities.create', {
      title: 'Pétanque à Fann',
      category: 'games',
      description: '',
      // Le schéma de création compare à l'heure réelle, le client simulé à TEST_NOW.
      startsAt: new Date(Math.max(Date.now(), TEST_NOW.getTime()) + 86_400_000).toISOString(),
      location: {
        name: 'Fann',
        coordinates: { lat: 14.69, lng: -17.46 },
        neighborhood: 'fann',
        meetingPoint: null,
      },
      capacity: 6,
      cost: { type: 'free' },
    });
    await renderWithQuery(<ChatScreen id={created.viewerState.conversationId ?? ''} />);
    expect(await screen.findByText('Brise la glace : dis bonjour au groupe !')).toBeOnTheScreen();
  });

  it('message privé : l’autre personne en en-tête, sans RDV épinglé', async () => {
    await renderWithQuery(<ChatScreen id="d_u_awa__u_moussa" />);
    expect(await screen.findByRole('header', { name: 'Moussa' })).toBeOnTheScreen();
    expect(
      await screen.findByText('Oui, samedi matin ! Je crée la sortie ce soir'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Rendez-vous/ })).toBeNull();
  });

  it('appui long sur le message de quelqu’un : le signaler', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === 'Signaler ce message')?.onPress?.();
    });
    await renderWithQuery(<ChatScreen id="d_u_awa__u_moussa" />);
    const message = await screen.findByText('Oui, samedi matin ! Je crée la sortie ce soir');
    await fireEvent(message, 'longPress');
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/report',
      params: { targetType: 'message', targetId: expect.any(String) },
    });
    alert.mockRestore();
  });

  it('personne bloquée : la discussion est fermée', async () => {
    await client.request('blocks.create', { userId: 'u_moussa' });
    await renderWithQuery(<ChatScreen id="d_u_awa__u_moussa" />);
    expect(await screen.findByText('Tu ne peux plus écrire à cette personne.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Ton message')).toBeNull();
  });

  it('groupe dont on ne fait pas partie : message clair', async () => {
    await renderWithQuery(<ChatScreen id="c_a_foot" />);
    expect(await screen.findByText('Impossible de charger la discussion.')).toBeOnTheScreen();
  });
});
