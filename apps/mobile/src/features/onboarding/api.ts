import type { OnboardingProfile, UpdateMeInput } from '@lokky/shared';
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
  const uploadOrigin = new URL(target.uploadUrl).origin;
  if (__DEV__) console.info(`[Avatar] Uploading image to ${uploadOrigin}`);
  let res: Response;
  try {
    res = await fetch(target.uploadUrl, {
      method: target.method,
      headers: target.headers,
      body: file,
    });
  } catch (error) {
    if (__DEV__) console.error('[Avatar] R2 upload request failed before receiving a response.', error);
    throw error;
  }
  if (__DEV__) console.info(`[Avatar] R2 upload responded with HTTP ${res.status}`);
  if (!res.ok) {
    const errorBody = await res.text();
    const code = errorBody.match(/<Code>([^<]+)<\/Code>/)?.[1];
    const message = errorBody.match(/<Message>([^<]+)<\/Message>/)?.[1];
    if (__DEV__) {
      console.error('[Avatar] R2 rejected the upload.', {
        status: res.status,
        code,
        message,
      });
    }
    throw new Error(
      `Envoi de l’avatar refusé (${res.status}${code ? `, ${code}` : ''})${message ? ` : ${message}` : ''}.`,
    );
  }
  return target.publicUrl;
}

export const setAvatarUrl = (avatarUrl: string) => apiClient.request('me.update', { avatarUrl });

// Modification du profil depuis les réglages.
export const updateProfile = (changes: UpdateMeInput) => apiClient.request('me.update', changes);
