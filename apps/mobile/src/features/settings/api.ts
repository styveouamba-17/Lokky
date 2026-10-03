import type { UpdateMeInput } from '@lokky/shared';
import { apiClient } from '@/api/client';

export const updateMe = (changes: UpdateMeInput) => apiClient.request('me.update', changes);
export const listBlocks = () => apiClient.request('blocks.list', {});
export const unblockUser = (userId: string) => apiClient.request('blocks.delete', { userId });
export const deleteAccount = () => apiClient.request('me.delete', {});
