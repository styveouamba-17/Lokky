import { apiClient } from '@/api/client';

export const registerPushToken = (token: string, platform: 'ios' | 'android') =>
  apiClient.request('me.registerPushToken', { token, platform });
