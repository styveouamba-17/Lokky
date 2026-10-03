import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { markConversationRead } from '../api';
import { clearUnread } from '../cache';
import { useActiveConversation } from '@/state/activeConversation';

// Conversation ouverte : lue à l'ouverture et à chaque nouveau message.
export function useMarkRead(conversationId: string, lastMessageId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    useActiveConversation.setState({ id: conversationId });
    return () => {
      if (useActiveConversation.getState().id === conversationId) {
        useActiveConversation.setState({ id: null });
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (!lastMessageId) return;
    clearUnread(queryClient, conversationId);
    markConversationRead(conversationId).catch(() => undefined); // au mieux
  }, [conversationId, lastMessageId, queryClient]);
}
