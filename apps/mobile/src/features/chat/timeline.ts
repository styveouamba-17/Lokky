import { startOfDakarDay, type Message, type UserPreview } from '@lokky/shared';
import { formatDayLabel } from '@/lib';
import type { OutgoingMessage, OutgoingStatus } from './outbox';

export type BubbleStatus = 'sent' | OutgoingStatus;

export type TimelineItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'system'; key: string; body: string }
  | {
      kind: 'text';
      key: string;
      id: string | null; // null tant que le message n'est pas confirmé par le serveur
      body: string;
      createdAt: string;
      mine: boolean;
      sender: UserPreview | null;
      // Prénom et photo au premier message d'une série du même auteur.
      showSender: boolean;
      status: BubbleStatus;
      clientId: string | null;
    };

const dayKey = (iso: string) => startOfDakarDay(new Date(iso)).toISOString();

// Fil du chat, du plus récent au plus ancien (liste inversée) : messages du serveur, puis
// messages en file d'envoi, avec un séparateur à chaque nouveau jour.
export function buildTimeline({
  messages,
  outgoing,
  viewerId,
  now,
}: {
  messages: readonly Message[]; // du plus récent au plus ancien, comme l'API
  outgoing: readonly OutgoingMessage[];
  viewerId: string | null;
  now: Date;
}): TimelineItem[] {
  const seen = new Set<string>();
  const confirmed = new Set<string>();
  const server = [...messages].reverse().filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    if (m.clientId) confirmed.add(m.clientId);
    return true;
  });
  const pending = outgoing.filter((o) => !confirmed.has(o.clientId));

  const chronological: TimelineItem[] = [];
  let lastDay: string | null = null;
  let lastSenderId: string | null = null;

  const push = (createdAt: string, item: TimelineItem, senderId: string | null) => {
    const day = dayKey(createdAt);
    if (day !== lastDay) {
      chronological.push({ kind: 'day', key: `day-${day}`, label: formatDayLabel(createdAt, now) });
      lastDay = day;
      lastSenderId = null;
    }
    chronological.push(item);
    lastSenderId = senderId;
  };

  for (const m of server) {
    if (m.type === 'system') {
      push(m.createdAt, { kind: 'system', key: m.id, body: m.body }, null);
      continue;
    }
    const senderId = m.sender?.id ?? null;
    const mine = senderId !== null && senderId === viewerId;
    push(
      m.createdAt,
      {
        kind: 'text',
        key: m.clientId ?? m.id,
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        mine,
        sender: m.sender,
        showSender: !mine && senderId !== lastSenderId,
        status: 'sent',
        clientId: m.clientId,
      },
      senderId,
    );
  }

  for (const o of pending) {
    push(
      o.createdAt,
      {
        kind: 'text',
        // Même clé que le message confirmé : la bulle ne clignote pas au remplacement.
        key: o.clientId,
        id: null,
        body: o.body,
        createdAt: o.createdAt,
        mine: true,
        sender: null,
        showSender: false,
        status: o.status,
        clientId: o.clientId,
      },
      viewerId,
    );
  }

  return chronological.reverse();
}
