import { apiClient } from '@/api/client';

export const getUser = (id: string) => apiClient.request('users.get', { id });
export const listUserActivities = (id: string) => apiClient.request('users.activities', { id });
export const openDirect = (userId: string) =>
  apiClient.request('conversations.openDirect', { userId });
export const blockUser = (userId: string) => apiClient.request('blocks.create', { userId });
export const unblockUser = (userId: string) => apiClient.request('blocks.delete', { userId });
