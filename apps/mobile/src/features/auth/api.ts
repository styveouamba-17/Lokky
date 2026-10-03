import { apiClient } from '@/api/client';
import type { OAuthCredential } from './providers';

export const requestEmailCode = (email: string) => apiClient.request('auth.emailStart', { email });

export const signInWithOAuth = (credential: OAuthCredential) =>
  apiClient.request('auth.oauth', credential);

export const verifyEmailCode = (email: string, code: string) =>
  apiClient.request('auth.emailVerify', { email, code });
