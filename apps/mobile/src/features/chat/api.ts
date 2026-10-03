import type { SendMessageInput } from '@lokky/shared';
import { apiClient } from '@/api/client';

export const listConversations = (cursor?: string) =>
  apiClient.request('conversations.list', { cursor });
export const getConversation = (id: string) => apiClient.request('conversations.get', { id });
export const markConversationRead = (id: string) =>
  apiClient.request('conversations.markRead', { id });
export const listMessages = (conversationId: string, cursor?: string) =>
  apiClient.request('messages.list', { conversationId, cursor });
export const sendMessage = (input: SendMessageInput) => apiClient.request('messages.send', input);
// L'en-tête et la bannière du RDV lisent l'activité du groupe.
export const getGroupActivity = (id: string) => apiClient.request('activities.get', { id });
