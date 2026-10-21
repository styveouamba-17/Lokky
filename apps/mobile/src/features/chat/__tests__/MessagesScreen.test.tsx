import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { makeTestClient, renderWithQuery, signInAs } from '@/test/mockApi';
import { listConversations } from '../api';
import { useChatStore } from '../chatStore';
import { MessagesScreen } from '../screens/MessagesScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock('../api', () => ({ listConversations: jest.fn() }));

describe('MessagesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { client, me } = makeTestClient();
    signInAs(me);
    jest
      .mocked(listConversations)
      .mockImplementation((cursor) => client.request('conversations.list', { cursor }));
  });

  it('liste les groupes avec le dernier message et les non-lus', async () => {
    await renderWithQuery(<MessagesScreen />);
    expect(
      await screen.findByRole('button', {
        name: 'Coucher de soleil aux Mamelles, 2 messages non lus',
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Moussa : Moi je pars de Yoff, je vous retrouve au parking'),
    ).toBeOnTheScreen();
    expect(screen.getAllByTestId('activity-group-avatar').length).toBeGreaterThan(0);
    // Dernier message envoyé par Awa elle-même
    expect(screen.getByText('Toi : Grave, j’ai adoré')).toBeOnTheScreen();
  });

  it('montre qui est en train d’écrire à la place du dernier message', async () => {
    await renderWithQuery(<MessagesScreen />);
    await screen.findByText('Moussa : Moi je pars de Yoff, je vous retrouve au parking');
    const conversationId = 'c_a_mamelles';
    await act(() =>
      useChatStore
        .getState()
        .setTyping(conversationId, { id: 'u_moussa', firstName: 'Moussa', avatarUrl: null }, true),
    );
    expect(screen.getByText('Moussa écrit…')).toBeOnTheScreen();
    expect(
      screen.queryByText('Moussa : Moi je pars de Yoff, je vous retrouve au parking'),
    ).not.toBeOnTheScreen();
    await act(() =>
      useChatStore
        .getState()
        .setTyping(conversationId, { id: 'u_moussa', firstName: 'Moussa', avatarUrl: null }, false),
    );
    expect(
      screen.getByText('Moussa : Moi je pars de Yoff, je vous retrouve au parking'),
    ).toBeOnTheScreen();
  });

  it('ouvre la discussion', async () => {
    await renderWithQuery(<MessagesScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Thieb entre potes' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/chat/[id]',
      params: { id: 'c_a_thieb' },
    });
  });

  it('aucune discussion : invite à découvrir des sorties', async () => {
    jest.mocked(listConversations).mockResolvedValue({ items: [], nextCursor: null });
    await renderWithQuery(<MessagesScreen />);
    expect(await screen.findByTestId('empty-state-artwork-fade')).toBeOnTheScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Découvrir des sorties' }));
    expect(router.navigate).toHaveBeenCalledWith('/discover');
  });
});
