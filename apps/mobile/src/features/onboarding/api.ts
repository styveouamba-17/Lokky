import type { OnboardingProfile } from '@lokky/shared';
import { apiClient } from '@/api/client';
import { env } from '@/lib/env';

export const completeOnboarding = (profile: OnboardingProfile) =>
  apiClient.request('me.completeOnboarding', profile);

// Avatar (spec §7.4) : envoi via une URL signée fournie par l'API. En mode mock, l'URI locale
// (déjà compressée sur le téléphone) est conservée telle quelle.
export async function uploadAvatar(localUri: string): Promise<string> {
  if (env.apiMode === 'mock') return localUri;
  const target = await apiClient.request('me.avatarUploadUrl', { contentType: 'image/jpeg' });
  const file = await (await fetch(localUri)).blob();
  const res = await fetch(target.uploadUrl, {
    method: target.method,
    headers: target.headers,
    body: file,
  });
  if (!res.ok) throw new Error(`Envoi de l’avatar refusé (${res.status}).`);
  return target.publicUrl;
}

export const setAvatarUrl = (avatarUrl: string) => apiClient.request('me.update', { avatarUrl });
