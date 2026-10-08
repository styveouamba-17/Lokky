import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { realtime } from '@/api/client';
import { useActiveConversation } from '@/state/activeConversation';
import { useNetworkStore } from '@/state/network';
import { useSessionStore } from '@/state/session';
import { receiveMessage, receiveUpdatedMessage } from '../cache';
import { useChatStore } from '../chatStore';
import { confirm } from '../outbox';
import { chatKeys } from '../queryKeys';
import { flushChatOutbox } from './useSendMessage';

// Une saisie sans nouvelle du serveur s'efface d'elle-même.
const TYPING_TIMEOUT_MS = 6000;

// Temps réel du chat (spec §7.3), monté tant que l'utilisateur est connecté (onglets).
// Aucun polling : le socket pousse les messages, et on resynchronise à la reconnexion.
export function useChatRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    useChatStore.getState().setUnreadTotal(null);
    const offs = [
      realtime.on('message:new', (message) => {
        confirm(message.clientId);
        const viewerId = useSessionStore.getState().me?.id ?? null;
        const activeConversationId = useActiveConversation.getState().id;
        const unreadTotal = useChatStore.getState().unreadTotal;
        receiveMessage(queryClient, message, {
          viewerId,
          activeConversationId,
        });
        if (
          unreadTotal !== null &&
          message.type === 'text' &&
          message.sender?.id !== viewerId &&
          message.conversationId !== activeConversationId
        ) {
          useChatStore.getState().setUnreadTotal(unreadTotal + 1);
        }
        if (message.sender) {
          useChatStore.getState().setTyping(message.conversationId, message.sender, false);
        }
      }),
      realtime.on('message:updated', (message) => {
        receiveUpdatedMessage(queryClient, message);
      }),
      realtime.on('typing', ({ conversationId, user, isTyping }) => {
        const key = `${conversationId}:${user.id}`;
        clearTimeout(typingTimers.get(key));
        useChatStore.getState().setTyping(conversationId, user, isTyping);
        if (isTyping) {
          typingTimers.set(
            key,
            setTimeout(
              () => useChatStore.getState().setTyping(conversationId, user, false),
              TYPING_TIMEOUT_MS,
            ),
          );
        }
      }),
      realtime.on('unread:update', ({ total }) => {
        useChatStore.getState().setUnreadTotal(total);
        void queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
      }),
      realtime.onConnectionChange((connected) => {
        if (!connected) return;
        void queryClient.invalidateQueries({ queryKey: chatKeys.all });
        void flushChatOutbox(queryClient);
      }),
      // Retour du réseau : on renvoie ce qui attendait.
      useNetworkStore.subscribe((state, previous) => {
        if (state.online && !previous.online) void flushChatOutbox(queryClient);
      }),
    ];
    realtime.connect();
    return () => {
      offs.forEach((off) => off());
      typingTimers.forEach(clearTimeout);
      realtime.disconnect();
      useChatStore.getState().setUnreadTotal(null);
    };
  }, [queryClient]);
}
