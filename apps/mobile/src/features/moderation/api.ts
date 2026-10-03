import { apiClient } from '@/api/client';

export const getMe = () => apiClient.request('me.get', {});
