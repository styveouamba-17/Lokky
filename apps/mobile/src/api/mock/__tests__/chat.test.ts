import type { Message } from '@lokky/shared';
import { ApiError } from '../../errors';
import { createMockDb } from '../db';
import { mockHandlers } from '../handlers';
import { createMockClient } from '../mockClient';
import { createMockSocket, MOCK_REPLIES } from '../mockSocket';

// Mercredi 7 octobre 2026, 10h (Dakar).
const NOW = new Date('2026-10-07T10:00:00Z');

function setup() {
  const db = createMockDb(NOW, { viewerOnboarded: true });
  const client = createMockClient({
    handlers: mockHandlers,
    db,
    now: () => NOW,
    sleep: () => Promise.resolve(),
  });
  return { db, client };
}

describe('client simulé : chat de groupe', () => {
  it('liste les groupes du spectateur, le plus récent d’abord, avec les non-lus', async () => {
    const { client } = setup();
    const page = await client.request('conversations.list', {});
    expect(page.items.map((c) => c.activityId ?? c.title)).toEqual([
      'a_mamelles',
      'Moussa', // message privé
      'a_bu',
      'a_footing',
      'a_thieb',
      'a_the',
    ]);
    expect(page.items[0]?.unreadCount).toBe(2);
    expect(page.items[0]?.lastMessage?.sender?.firstName).toBe('Moussa');
  });

  it('le détail d’une activité donne son chat aux seuls participants', async () => {
    const { client } = setup();
    const joined = await client.request('activities.get', { id: 'a_bu' });
    expect(joined.viewerState.conversationId).toBe('c_a_bu');
    const other = await client.request('activities.get', { id: 'a_foot' });
    expect(other.viewerState.conversationId).toBeNull();
  });

  it('refuse le chat d’un groupe dont on ne fait pas partie', async () => {
    const { client } = setup();
    await expect(
      client.request('messages.list', { conversationId: 'c_a_foot' }),
    ).rejects.toMatchObject({ code: 'not_participant' });
  });

  it('« Je viens ! » ouvre le chat avec l’historique et un message système', async () => {
    const { client } = setup();
    await client.request('activities.join', { id: 'a_foot' });
    const page = await client.request('messages.list', { conversationId: 'c_a_foot' });
    expect(page.items[0]).toMatchObject({
      type: 'system',
      sender: null,
      body: 'Awa a rejoint le groupe',
    });
    expect(page.items.length).toBeGreaterThan(1);
  });

  it('quitter retire du groupe et l’annonce', async () => {
    const { client, db } = setup();
    await client.request('activities.leave', { id: 'a_mamelles' });
    expect(db.messages.get('c_a_mamelles')?.at(-1)?.body).toBe('Awa a quitté le groupe');
    await expect(
      client.request('conversations.get', { id: 'c_a_mamelles' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('les messages arrivent du plus récent au plus ancien, paginés', async () => {
    const { client } = setup();
    const page = await client.request('messages.list', {
      conversationId: 'c_a_mamelles',
      limit: 3,
    });
    expect(page.items.map((m) => m.sender?.firstName ?? 'système')).toEqual([
      'Moussa',
      'Aminata',
      'système',
    ]);
    expect(page.nextCursor).toBe('3');
  });

  it('envoie un message, sans doublon si on le rejoue avec le même clientId', async () => {
    const { client, db } = setup();
    const input = {
      conversationId: 'c_a_bu',
      clientId: 'client-0001',
      body: '  On se voit à 10h ?  ',
    };
    const sent = await client.request('messages.send', input);
    expect(sent).toMatchObject({ body: 'On se voit à 10h ?', clientId: 'client-0001' });
    const again = await client.request('messages.send', input);
    expect(again.id).toBe(sent.id);
    expect(db.messages.get('c_a_bu')?.filter((m) => m.clientId === 'client-0001')).toHaveLength(1);
  });

  it('marquer comme lu remet le compteur à zéro', async () => {
    const { client } = setup();
    await client.request('conversations.markRead', { id: 'c_a_mamelles' });
    const conv = await client.request('conversations.get', { id: 'c_a_mamelles' });
    expect(conv.unreadCount).toBe(0);
  });

  it('une discussion passée depuis plus de 7 jours est en lecture seule', async () => {
    const db = createMockDb(NOW, { viewerOnboarded: true });
    const later = new Date(NOW.getTime() + 8 * 86_400_000);
    const client = createMockClient({
      handlers: mockHandlers,
      db,
      now: () => later,
      sleep: () => Promise.resolve(),
    });
    const conv = await client.request('conversations.get', { id: 'c_a_footing' });
    expect(conv.isReadOnly).toBe(true);
    await expect(
      client.request('messages.send', {
        conversationId: 'c_a_footing',
        clientId: 'client-0002',
        body: 'Hello',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('MockSocket', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('diffuse les nouveaux messages des groupes du spectateur, puis simule une réponse', async () => {
    const { db, client } = setup();
    const socket = createMockSocket({ db, now: () => NOW, random: () => 0 });
    const received: Message[] = [];
    const typing: boolean[] = [];
    socket.on('message:new', (m) => received.push(m));
    socket.on('typing', (p) => typing.push(p.isTyping));
    socket.connect();

    await client.request('messages.send', {
      conversationId: 'c_a_bu',
      clientId: 'client-0003',
      body: 'Je garde une place ?',
    });
    expect(received.map((m) => m.body)).toEqual(['Je garde une place ?']);

    jest.advanceTimersByTime(700);
    expect(typing).toEqual([true]);
    jest.advanceTimersByTime(5000);
    expect(typing).toEqual([true, false]);
    expect(received[1]).toMatchObject({ body: MOCK_REPLIES[0], sender: { firstName: 'Fatou' } });
    socket.disconnect();
  });

  it('ignore les groupes dont le spectateur ne fait pas partie', () => {
    const { db } = setup();
    const socket = createMockSocket({ db });
    const received: Message[] = [];
    socket.on('message:new', (m) => received.push(m));
    socket.connect();
    db.bus.publish({
      id: 'm_x',
      clientId: null,
      conversationId: 'c_a_foot',
      senderId: 'u_moussa',
      type: 'text',
      body: 'Hello',
      createdAt: NOW.toISOString(),
    });
    expect(received).toHaveLength(0);
  });

  it('signale la connexion et la déconnexion', () => {
    const { db } = setup();
    const socket = createMockSocket({ db });
    const states: boolean[] = [];
    socket.onConnectionChange((c) => states.push(c));
    socket.connect();
    socket.disconnect();
    expect(states).toEqual([true, false]);
    expect(socket.isConnected()).toBe(false);
  });
});
