import type { Message } from '@lokky/shared';
import { buildTimeline } from '../timeline';

const NOW = new Date('2026-10-07T10:00:00Z');
const moussa = { id: 'u_moussa', firstName: 'Moussa', avatarUrl: null };
const awa = { id: 'u_awa', firstName: 'Awa', avatarUrl: null };

const msg = (id: string, createdAt: string, overrides: Partial<Message> = {}): Message => ({
  id,
  clientId: null,
  conversationId: 'c1',
  sender: moussa,
  type: 'text',
  body: id,
  createdAt,
  ...overrides,
});

describe('buildTimeline', () => {
  it('ajoute un séparateur par jour et regroupe les messages d’un même auteur', () => {
    const items = buildTimeline({
      // du plus récent au plus ancien, comme l'API
      messages: [
        msg('m4', '2026-10-07T09:02:00Z', { sender: awa }),
        msg('m3', '2026-10-07T09:01:00Z'),
        msg('m2', '2026-10-07T09:00:00Z'),
        msg('m1', '2026-10-06T18:00:00Z', {
          type: 'system',
          sender: null,
          body: 'Awa a rejoint le groupe',
        }),
      ],
      outgoing: [],
      viewerId: 'u_awa',
      now: NOW,
    });
    expect(items.map((i) => (i.kind === 'day' ? i.label : i.key))).toEqual([
      'm4',
      'm3',
      'm2',
      'Aujourd’hui',
      'm1',
      'Hier',
    ]);
    const text = items.filter((i) => i.kind === 'text');
    expect(text.map((i) => [i.mine, i.showSender])).toEqual([
      [true, false],
      [false, false],
      [false, true],
    ]);
  });

  it('affiche les messages en file après les autres, sans doublon une fois confirmés', () => {
    const outgoing = [
      {
        clientId: 'cA',
        conversationId: 'c1',
        body: 'Déjà parti',
        createdAt: '2026-10-07T09:05:00Z',
        status: 'sending' as const,
      },
      {
        clientId: 'cB',
        conversationId: 'c1',
        body: 'Hors ligne',
        createdAt: '2026-10-07T09:06:00Z',
        status: 'waiting' as const,
      },
    ];
    const items = buildTimeline({
      messages: [
        msg('m9', '2026-10-07T09:05:01Z', { sender: awa, clientId: 'cA', body: 'Déjà parti' }),
      ],
      outgoing,
      viewerId: 'u_awa',
      now: NOW,
    });
    const text = items.filter((i) => i.kind === 'text');
    expect(text.map((i) => [i.key, i.status])).toEqual([
      ['cB', 'waiting'],
      ['cA', 'sent'],
    ]);
  });

  it('ignore un message reçu deux fois (socket et pagination)', () => {
    const m = msg('m1', '2026-10-07T09:00:00Z');
    const items = buildTimeline({ messages: [m, m], outgoing: [], viewerId: 'u_awa', now: NOW });
    expect(items.filter((i) => i.kind === 'text')).toHaveLength(1);
  });
});
