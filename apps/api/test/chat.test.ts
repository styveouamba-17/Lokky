import { conversationSchema, messageSchema, paginatedSchema } from '@lokky/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createActivity, createMember } from './factories';
import { createTestApp, resetDatabase } from './helpers';

const NOW = new Date('2026-10-07T10:00:00Z');
const H = 3_600_000;
const at = (hours: number) => new Date(NOW.getTime() + hours * H);

let t: Awaited<ReturnType<typeof createTestApp>>;
let clock = NOW;
beforeAll(async () => {
  t = await createTestApp({ now: () => clock });
});
afterAll(() => t.close());
beforeEach(async () => {
  clock = NOW;
  await resetDatabase(t.db);
});

const messagesPage = paginatedSchema(messageSchema);
const conversationsPage = paginatedSchema(conversationSchema);
const later = (minutes: number) => {
  clock = new Date(clock.getTime() + minutes * 60_000);
};

describe('chat de groupe', () => {
  it('« Je viens ! » ajoute au groupe avec un message système', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);

    const page = messagesPage.parse(
      (await awa.call('GET', `/conversations/${conversationId}/messages`)).json(),
    );
    expect(page.items[0]).toMatchObject({
      type: 'system',
      sender: null,
      body: 'Awa a rejoint le groupe',
    });
  });

  it('envoyer, lire, sans doublon pour un même clientId', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { conversationId } = await createActivity(t, moussa.id, {
      startsAt: at(8),
      participantIds: [awa.id],
    });
    // createActivity n'ajoute que le créateur au groupe : on rejoint comme dans l'app.
    const input = { clientId: 'client-0001', body: '  On se retrouve à 17h50 ?  ' };
    const join = await awa.call('POST', `/conversations/${conversationId}/messages`, input);
    expect(join.statusCode).toBe(403); // pas encore membre du groupe

    const other = await createActivity(t, moussa.id, { startsAt: at(9) });
    await awa.call('POST', `/activities/${other.id}/join`);
    const sent = await awa.call('POST', `/conversations/${other.conversationId}/messages`, input);
    expect(sent.statusCode).toBe(200);
    expect(messageSchema.parse(sent.json())).toMatchObject({
      body: 'On se retrouve à 17h50 ?',
      clientId: 'client-0001',
      sender: { firstName: 'Awa' },
    });
    const again = await awa.call('POST', `/conversations/${other.conversationId}/messages`, input);
    expect(again.json().id).toBe(sent.json().id);
  });

  it('non-lus : messages des autres après la dernière lecture', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);
    later(1);
    await moussa.call('POST', `/conversations/${conversationId}/messages`, {
      clientId: 'client-m1',
      body: 'Bienvenue !',
    });
    later(1);
    await moussa.call('POST', `/conversations/${conversationId}/messages`, {
      clientId: 'client-m2',
      body: 'Prends tes baskets',
    });

    const list = conversationsPage.parse((await awa.call('GET', '/conversations')).json());
    expect(list.items[0]).toMatchObject({
      type: 'group',
      activityId: id,
      title: 'Foot à la plage',
      unreadCount: 2,
      lastMessage: { body: 'Prends tes baskets', sender: { firstName: 'Moussa' } },
    });
    later(1);
    await awa.call('POST', `/conversations/${conversationId}/read`);
    expect((await awa.call('GET', `/conversations/${conversationId}`)).json().unreadCount).toBe(0);
  });

  it('pagination : du plus récent au plus ancien', async () => {
    const moussa = await createMember(t, 'Moussa');
    const { conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    for (let i = 1; i <= 5; i += 1) {
      later(1);
      await moussa.call('POST', `/conversations/${conversationId}/messages`, {
        clientId: `client-p${i}`,
        body: `Message ${i}`,
      });
    }
    const first = messagesPage.parse(
      (await moussa.call('GET', `/conversations/${conversationId}/messages?limit=2`)).json(),
    );
    expect(first.items.map((m) => m.body)).toEqual(['Message 5', 'Message 4']);
    const second = messagesPage.parse(
      (
        await moussa.call(
          'GET',
          `/conversations/${conversationId}/messages?limit=2&cursor=${first.nextCursor}`,
        )
      ).json(),
    );
    expect(second.items.map((m) => m.body)).toEqual(['Message 3', 'Message 2']);
  });

  it('lecture seule 7 jours après la fin de la sortie', async () => {
    const moussa = await createMember(t, 'Moussa');
    const old = await createActivity(t, moussa.id, { startsAt: at(-24 * 8) });
    const conv = (await moussa.call('GET', `/conversations/${old.conversationId}`)).json();
    expect(conv.isReadOnly).toBe(true);
    const res = await moussa.call('POST', `/conversations/${old.conversationId}/messages`, {
      clientId: 'client-old',
      body: 'Hello',
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('messages privés', () => {
  it('après une sortie passée ensemble : une seule conversation par paire', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, { startsAt: at(-48), participantIds: [awa.id] });

    const opened = await awa.call('POST', '/conversations/direct', { userId: moussa.id });
    expect(opened.statusCode).toBe(200);
    expect(conversationSchema.parse(opened.json())).toMatchObject({
      type: 'direct',
      title: 'Moussa',
      peer: { id: moussa.id },
    });
    const fromOtherSide = await moussa.call('POST', '/conversations/direct', { userId: awa.id });
    expect(fromOtherSide.json().id).toBe(opened.json().id);
    expect(fromOtherSide.json().title).toBe('Awa');
  });

  it('n’apparaît dans la liste qu’au premier message', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, { startsAt: at(-48), participantIds: [awa.id] });
    const { id } = (await awa.call('POST', '/conversations/direct', { userId: moussa.id })).json();

    const listed = async (who: typeof awa) =>
      conversationsPage
        .parse((await who.call('GET', '/conversations')).json())
        .items.some((c) => c.id === id);
    expect(await listed(awa)).toBe(false);
    expect(await listed(moussa)).toBe(false);

    await awa.call('POST', `/conversations/${id}/messages`, {
      clientId: 'client-dm1',
      body: 'Salut !',
    });
    expect(await listed(awa)).toBe(true);
    expect(await listed(moussa)).toBe(true);
  });

  it('impossible sans sortie partagée', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const res = await awa.call('POST', '/conversations/direct', { userId: moussa.id });
    expect(res.statusCode).toBe(403);
  });

  it('une conversation privée reste privée', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    await createActivity(t, moussa.id, { startsAt: at(-48), participantIds: [awa.id] });
    const { id } = (await awa.call('POST', '/conversations/direct', { userId: moussa.id })).json();
    expect((await fatou.call('GET', `/conversations/${id}/messages`)).statusCode).toBe(403);
  });
});
