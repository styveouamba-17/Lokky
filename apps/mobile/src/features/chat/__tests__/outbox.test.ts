import type { Message } from '@lokky/shared';
import { ApiError } from '@/api/errors';
import { enqueue, flushOutbox, retry, useOutbox, type OutgoingMessage } from '../outbox';

const NOW = new Date('2026-10-07T10:00:00Z');

const asMessage = (o: OutgoingMessage): Message => ({
  id: `m_${o.clientId}`,
  clientId: o.clientId,
  conversationId: o.conversationId,
  sender: { id: 'u_awa', firstName: 'Awa', avatarUrl: null },
  type: 'text',
  body: o.body,
  replyTo: o.replyTo ?? null,
  editedAt: null,
  createdAt: o.createdAt,
});

const statuses = () => useOutbox.getState().items.map((i) => i.status);

describe('file d’envoi des messages', () => {
  beforeEach(() => useOutbox.setState({ items: [] }));

  it('envoie dans l’ordre puis vide la file', async () => {
    const sent: string[] = [];
    enqueue('c1', '  Salut  ', NOW);
    enqueue('c1', 'Ça va ?', NOW);
    await flushOutbox({
      send: async (o) => {
        sent.push(o.body);
        return asMessage(o);
      },
      onSent: () => undefined,
      isOnline: () => true,
    });
    expect(sent).toEqual(['Salut', 'Ça va ?']);
    expect(useOutbox.getState().items).toHaveLength(0);
  });

  it('hors ligne : garde les messages en attente, sans rien envoyer', async () => {
    const send = jest.fn();
    enqueue('c1', 'Salut', NOW);
    await flushOutbox({ send, onSent: () => undefined, isOnline: () => false });
    expect(send).not.toHaveBeenCalled();
    expect(statuses()).toEqual(['waiting']);
  });

  it('panne réseau : remet en attente et s’arrête, pour réessayer à la reconnexion', async () => {
    enqueue('c1', 'Un', NOW);
    enqueue('c1', 'Deux', NOW);
    const send = jest.fn().mockRejectedValue(new ApiError('network', 'Hors ligne'));
    await flushOutbox({ send, onSent: () => undefined, isOnline: () => true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(statuses()).toEqual(['waiting', 'waiting']);
  });

  it('refus du serveur : échec, puis renvoi possible', async () => {
    const item = enqueue('c1', 'Salut', NOW);
    const send = jest.fn().mockRejectedValueOnce(new ApiError('forbidden', 'Fermé', 403));
    await flushOutbox({ send, onSent: () => undefined, isOnline: () => true });
    expect(statuses()).toEqual(['failed']);

    send.mockImplementation(async (o: OutgoingMessage) => asMessage(o));
    const onSent = jest.fn();
    retry(item.clientId);
    await flushOutbox({ send, onSent, isOnline: () => true });
    expect(onSent).toHaveBeenCalledWith(expect.objectContaining({ clientId: item.clientId }));
    expect(useOutbox.getState().items).toHaveLength(0);
  });
});
