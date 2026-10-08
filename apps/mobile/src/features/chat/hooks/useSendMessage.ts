import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useActiveConversation } from '@/state/activeConversation';
import { useNetworkStore } from '@/state/network';
import { useSessionStore } from '@/state/session';
import { sendMessage } from '../api';
import { receiveMessage } from '../cache';
import { discard, enqueue, flushOutbox, retry } from '../outbox';

// Envoie la file, puis range chaque message confirmé dans le cache (spec §7.2).
export function flushChatOutbox(queryClient: QueryClient) {
  return flushOutbox({
    send: ({ conversationId, clientId, body, replyTo }) =>
      sendMessage({
        conversationId,
        clientId,
        body,
        replyToMessageId: replyTo?.id ?? null,
      }),
    onSent: (message) =>
      receiveMessage(queryClient, message, {
        viewerId: useSessionStore.getState().me?.id ?? null,
        activeConversationId: useActiveConversation.getState().id,
      }),
    isOnline: () => useNetworkStore.getState().online,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const send = useCallback(
    (body: string, replyTo: Parameters<typeof enqueue>[2] = null) => {
      if (!body.trim()) return;
      enqueue(conversationId, body, replyTo);
      void flushChatOutbox(queryClient);
    },
    [conversationId, queryClient],
  );
  const resend = useCallback(
    (clientId: string) => {
      retry(clientId);
      void flushChatOutbox(queryClient);
    },
    [queryClient],
  );
  return { send, resend, discard };
}
