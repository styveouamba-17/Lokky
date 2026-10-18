import { describe, expect, it } from 'vitest';
import { createR2AvatarStorage } from '../src/services/avatarStorage';

const SETTINGS = {
  accountId: 'account',
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
  bucket: 'avatars',
  publicBaseUrl: 'https://pub-example.r2.dev',
};

describe('stockage R2 des avatars', () => {
  it('refuse l’endpoint S3 comme URL publique des avatars', () => {
    expect(() =>
      createR2AvatarStorage({
        ...SETTINGS,
        publicBaseUrl: 'https://account.r2.cloudflarestorage.com',
      }),
    ).toThrow('AVATAR_PUBLIC_BASE_URL doit être une URL publique R2');
  });

  it('accepte une URL publique r2.dev', () => {
    const storage = createR2AvatarStorage(SETTINGS);
    expect(storage.publicUrl('avatars/user/photo.jpg')).toBe(
      'https://pub-example.r2.dev/avatars/user/photo.jpg',
    );
  });
});
