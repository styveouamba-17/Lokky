import type { PushData } from '@lokky/shared';

// Envoi des notifications par le service push d'Expo (spec backend §10), qui les transmet à
// Apple (APNs) et Google (FCM) : elles s'affichent même app fermée.

export interface PushMessage {
  to: string; // jeton Expo
  title: string;
  body: string;
  data: PushData;
}

export interface PushSender {
  // Renvoie les jetons refusés définitivement (appli désinstallée…) : à supprimer.
  send(messages: readonly PushMessage[]): Promise<{ invalidTokens: string[] }>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100; // limite de l'API Expo par requête

interface ExpoTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

export function createExpoPushSender({ accessToken }: { accessToken?: string } = {}): PushSender {
  return {
    async send(messages) {
      const invalidTokens: string[] = [];
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(
            batch.map((m) => ({ ...m, sound: 'default', channelId: 'default' })),
          ),
        });
        if (!res.ok) throw new Error(`Service push Expo indisponible (${res.status}).`);
        const { data } = (await res.json()) as { data: ExpoTicket[] };
        data.forEach((ticket, index) => {
          const message = batch[index];
          if (message && ticket.details?.error === 'DeviceNotRegistered') {
            invalidTokens.push(message.to);
          }
        });
      }
      return { invalidTokens };
    },
  };
}
