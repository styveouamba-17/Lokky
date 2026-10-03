import { createMockDb } from '../db';
import { mockHandlers } from '../handlers';
import { createMockClient } from '../mockClient';
import { createMockSocket } from '../mockSocket';

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

describe('client simulé : messages privés', () => {
  it('possibles seulement après une sortie partagée et passée', async () => {
    const { client } = setup();
    // Ousmane : footing ensemble (passé) ; Fatou : seulement des sorties à venir ensemble.
    const ousmane = await client.request('users.get', { id: 'u_ousmane' });
    expect(ousmane.relationship).toEqual({ canMessage: true, isBlocked: false });
    const fatou = await client.request('users.get', { id: 'u_fatou' });
    expect(fatou.relationship.canMessage).toBe(false);
    await expect(
      client.request('conversations.openDirect', { userId: 'u_fatou' }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('ouvre une seule conversation par paire, avec l’autre personne en en-tête', async () => {
    const { client } = setup();
    const first = await client.request('conversations.openDirect', { userId: 'u_ousmane' });
    expect(first).toMatchObject({ type: 'direct', title: 'Ousmane', peer: { id: 'u_ousmane' } });
    const again = await client.request('conversations.openDirect', { userId: 'u_ousmane' });
    expect(again.id).toBe(first.id);
    // Rien d'écrit : pas encore dans la liste des discussions.
    const before = await client.request('conversations.list', {});
    expect(before.items.some((c) => c.id === first.id)).toBe(false);

    await client.request('messages.send', {
      conversationId: first.id,
      clientId: 'client-dm-01',
      body: 'Salut Ousmane !',
    });
    const page = await client.request('messages.list', { conversationId: first.id });
    expect(page.items[0]?.body).toBe('Salut Ousmane !');
    const after = await client.request('conversations.list', {});
    expect(after.items.some((c) => c.id === first.id)).toBe(true);
  });

  it('retrouve la conversation existante avec Moussa', async () => {
    const { client } = setup();
    const conv = await client.request('conversations.openDirect', { userId: 'u_moussa' });
    expect(conv.lastMessage?.body).toBe('Oui, samedi matin ! Je crée la sortie ce soir');
    expect(conv.unreadCount).toBe(1);
  });

  it('le MockSocket fait répondre l’autre personne', async () => {
    jest.useFakeTimers();
    const { db, client } = setup();
    const socket = createMockSocket({ db, now: () => NOW, random: () => 0 });
    const bodies: string[] = [];
    socket.on('message:new', (m) => bodies.push(m.sender?.firstName ?? ''));
    socket.connect();
    const conv = await client.request('conversations.openDirect', { userId: 'u_moussa' });
    await client.request('messages.send', {
      conversationId: conv.id,
      clientId: 'client-dm-02',
      body: 'Je viens !',
    });
    jest.advanceTimersByTime(6000);
    expect(bodies).toEqual(['Awa', 'Moussa']);
    socket.disconnect();
    jest.useRealTimers();
  });
});

describe('client simulé : blocage', () => {
  it('coupe tout : profil marqué, sorties masquées, conversation fermée et retirée', async () => {
    const { client } = setup();
    await client.request('blocks.create', { userId: 'u_moussa' });

    const moussa = await client.request('users.get', { id: 'u_moussa' });
    expect(moussa.relationship).toEqual({ canMessage: false, isBlocked: true });

    const feed = await client.request('activities.list', { limit: 50 });
    expect(feed.items.some((a) => a.creator.id === 'u_moussa')).toBe(false);

    const list = await client.request('conversations.list', {});
    expect(list.items.some((c) => c.peer?.id === 'u_moussa')).toBe(false);
    const conv = await client.request('conversations.get', { id: 'd_u_awa__u_moussa' });
    expect(conv.isReadOnly).toBe(true);
    await expect(
      client.request('messages.send', {
        conversationId: conv.id,
        clientId: 'client-dm-03',
        body: 'Hello',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    const blocked = await client.request('blocks.list', {});
    expect(blocked.map((b) => b.firstName)).toEqual(['Moussa']);
  });

  it('débloquer rétablit la relation', async () => {
    const { client } = setup();
    await client.request('blocks.create', { userId: 'u_moussa' });
    await client.request('blocks.delete', { userId: 'u_moussa' });
    const moussa = await client.request('users.get', { id: 'u_moussa' });
    expect(moussa.relationship).toEqual({ canMessage: true, isBlocked: false });
  });

  it('une personne qui t’a bloquée devient introuvable', async () => {
    const { client, db } = setup();
    db.blocks.set('u_cheikh>u_awa', NOW.toISOString());
    await expect(client.request('users.get', { id: 'u_cheikh' })).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});

describe('client simulé : signalement et suppression', () => {
  it('enregistre le signalement', async () => {
    const { client, db } = setup();
    await client.request('reports.create', {
      targetType: 'message',
      targetId: 'm_a_foot_3',
      reason: 'harassment',
    });
    expect(db.reports).toEqual([
      expect.objectContaining({ targetId: 'm_a_foot_3', reporterId: 'u_awa' }),
    ]);
  });

  it('« autre » exige des détails', async () => {
    await expect(
      setup().client.request('reports.create', {
        targetType: 'user',
        targetId: 'u_moussa',
        reason: 'other',
      }),
    ).rejects.toThrow();
  });

  it('garde les préférences modifiées', async () => {
    const { client } = setup();
    const me = await client.request('me.get', {});
    await client.request('me.update', {
      preferences: { ...me.preferences, theme: 'dark' },
    });
    expect((await client.request('me.get', {})).preferences.theme).toBe('dark');
  });

  it('supprimer le compte relance l’onboarding à la prochaine connexion', async () => {
    const { client } = setup();
    await client.request('me.delete', {});
    await expect(client.request('me.get', {})).rejects.toMatchObject({
      code: 'onboarding_required',
    });
  });
});
