import { meSchema } from '@lokky/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, resetDatabase } from './helpers';

let t: Awaited<ReturnType<typeof createTestApp>>;
const NOW = new Date('2026-10-07T10:00:00Z');

beforeAll(async () => {
  t = await createTestApp({ now: () => NOW });
});
afterAll(() => t.close());
beforeEach(() => resetDatabase(t.db));

const PROFILE = {
  firstName: 'Awa',
  birthDate: '2004-03-12',
  status: 'student',
  neighborhood: 'fann',
  interests: ['beach', 'music', 'cinema'],
};

async function signIn() {
  await t.app.inject({
    method: 'POST',
    url: '/auth/email/start',
    payload: { email: 'awa@exemple.sn' },
  });
  const res = await t.app.inject({
    method: 'POST',
    url: '/auth/email/verify',
    payload: { email: 'awa@exemple.sn', code: t.lastCode('awa@exemple.sn') },
  });
  const token: string = res.json().tokens.accessToken;
  return (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) =>
    t.app.inject({ method, url, payload, headers: { authorization: `Bearer ${token}` } });
}

describe('profil (me)', () => {
  it('onboarding : le profil devient complet et respecte le contrat', async () => {
    const call = await signIn();
    expect((await call('GET', '/me')).json().error.code).toBe('onboarding_required');

    const res = await call('POST', '/me/onboarding', PROFILE);
    expect(res.statusCode).toBe(200);
    const me = meSchema.parse(res.json());
    expect(me).toMatchObject({
      firstName: 'Awa',
      email: 'awa@exemple.sn',
      preferences: { language: 'fr', theme: 'system' },
      moderation: { status: 'active', suspendedUntil: null },
      trust: { activitiesAttended: 0, attendanceRate: null },
    });
    expect((await call('GET', '/me')).json().firstName).toBe('Awa');
  });

  it('refuse un profil de moins de 18 ans', async () => {
    const call = await signIn();
    const res = await call('POST', '/me/onboarding', { ...PROFILE, birthDate: '2015-01-01' });
    expect(res.statusCode).toBe(400);
  });

  it('modifier le profil et les préférences', async () => {
    const call = await signIn();
    await call('POST', '/me/onboarding', PROFILE);
    const res = await call('PATCH', '/me', {
      neighborhood: 'ngor',
      preferences: {
        language: 'fr',
        theme: 'dark',
        notifications: { messages: false, activityUpdates: true, reminders: true },
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      neighborhood: 'ngor',
      preferences: { theme: 'dark', notifications: { messages: false } },
    });
  });

  it('photo : URL signée vers le dossier de la personne, puis enregistrement', async () => {
    const call = await signIn();
    await call('POST', '/me/onboarding', PROFILE);
    const upload = await call('POST', '/me/avatar/upload-url', { contentType: 'image/jpeg' });
    expect(upload.statusCode).toBe(200);
    const { publicUrl, method, headers } = upload.json();
    expect(method).toBe('PUT');
    expect(headers).toEqual({ 'Content-Type': 'image/jpeg' });
    expect(publicUrl).toMatch(new RegExp(`^${t.AVATAR_BASE}/avatars/[0-9a-f-]+/[0-9a-f-]+\\.jpg$`));

    const saved = await call('PATCH', '/me', { avatarUrl: publicUrl });
    expect(saved.json().avatarUrl).toBe(publicUrl);
  });

  it('refuse une photo qui ne vient pas de notre stockage', async () => {
    const call = await signIn();
    await call('POST', '/me/onboarding', PROFILE);
    const res = await call('PATCH', '/me', { avatarUrl: 'https://ailleurs.test/photo.jpg' });
    expect(res.statusCode).toBe(400);
  });
});
