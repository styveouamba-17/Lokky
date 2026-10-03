import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, resetDatabase } from './helpers';

let t: Awaited<ReturnType<typeof createTestApp>>;
let clock = new Date('2026-10-07T10:00:00Z');

beforeAll(async () => {
  t = await createTestApp({ now: () => clock });
});
afterAll(() => t.close());
beforeEach(async () => {
  clock = new Date('2026-10-07T10:00:00Z');
  await resetDatabase(t.db);
});

const post = (url: string, payload: object, token?: string) =>
  t.app.inject({
    method: 'POST',
    url,
    payload,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
const later = (seconds: number) => {
  clock = new Date(clock.getTime() + seconds * 1000);
};

async function signInByEmail(email = 'awa@exemple.sn') {
  await post('/auth/email/start', { email });
  const res = await post('/auth/email/verify', { email, code: t.lastCode(email) });
  return res.json();
}

describe('connexion par code email', () => {
  it('envoie un code, puis connecte : nouveau compte sans profil', async () => {
    expect((await post('/auth/email/start', { email: 'Awa@Exemple.sn' })).statusCode).toBe(200);
    const code = t.lastCode('awa@exemple.sn');
    expect(code).toMatch(/^\d{6}$/);

    const res = await post('/auth/email/verify', { email: 'awa@exemple.sn', code });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user).toBeNull(); // onboarding à faire
    expect(body.tokens).toMatchObject({ expiresIn: 900 });
  });

  it('un seul code par minute', async () => {
    await post('/auth/email/start', { email: 'awa@exemple.sn' });
    const again = await post('/auth/email/start', { email: 'awa@exemple.sn' });
    expect(again.statusCode).toBe(429);
    expect(again.json().error.code).toBe('rate_limited');
    later(61);
    expect((await post('/auth/email/start', { email: 'awa@exemple.sn' })).statusCode).toBe(200);
  });

  it('code faux : refusé, et bloqué après 5 essais', async () => {
    await post('/auth/email/start', { email: 'awa@exemple.sn' });
    const good = t.lastCode('awa@exemple.sn')!;
    const wrong = good === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i += 1) {
      const res = await post('/auth/email/verify', { email: 'awa@exemple.sn', code: wrong });
      expect(res.json().error.code).toBe('validation');
    }
    const blocked = await post('/auth/email/verify', { email: 'awa@exemple.sn', code: good });
    expect(blocked.json().error.code).toBe('rate_limited');
  });

  it('code expiré après 10 minutes', async () => {
    await post('/auth/email/start', { email: 'awa@exemple.sn' });
    later(10 * 60 + 1);
    const res = await post('/auth/email/verify', {
      email: 'awa@exemple.sn',
      code: t.lastCode('awa@exemple.sn'),
    });
    expect(res.statusCode).toBe(400);
  });

  it('se reconnecter avec le même email retrouve le même compte', async () => {
    const first = await signInByEmail();
    later(61);
    const second = await signInByEmail();
    const me = (token: string) =>
      t.app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${token}` } });
    // Pas encore de profil : les deux jetons mènent au même compte « à compléter ».
    expect((await me(first.tokens.accessToken)).json().error.code).toBe('onboarding_required');
    expect((await me(second.tokens.accessToken)).json().error.code).toBe('onboarding_required');
  });
});

describe('connexion Apple et Google', () => {
  it('rattache Apple puis Google au compte du même email', async () => {
    t.acceptIdToken('apple-ok', {
      subject: 'apple-1',
      email: 'awa@exemple.sn',
      emailVerified: true,
    });
    t.acceptIdToken('google-ok', { subject: 'g-1', email: 'Awa@exemple.sn', emailVerified: true });
    const apple = await post('/auth/oauth', { provider: 'apple', idToken: 'apple-ok' });
    expect(apple.statusCode).toBe(200);
    const google = await post('/auth/oauth', { provider: 'google', idToken: 'google-ok' });
    expect(google.statusCode).toBe(200);
    const byEmail = await signInByEmail();
    // Les trois connexions ouvrent le même compte : complété une fois, visible partout.
    const profile = {
      firstName: 'Awa',
      birthDate: '2004-03-12',
      status: 'student',
      neighborhood: 'fann',
      interests: ['beach', 'music', 'cinema'],
    };
    await post('/me/onboarding', profile, apple.json().tokens.accessToken);
    const me = await t.app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${google.json().tokens.accessToken}` },
    });
    expect(me.json().firstName).toBe('Awa');
    expect(byEmail.user).toBeNull(); // connecté avant la fin de l'onboarding
  });

  it('jeton refusé par le fournisseur : 401', async () => {
    const res = await post('/auth/oauth', { provider: 'google', idToken: 'inconnu' });
    expect(res.statusCode).toBe(401);
  });

  it('email non vérifié chez le fournisseur : refusé', async () => {
    t.acceptIdToken('google-unverified', { subject: 'g-2', email: 'x@y.sn', emailVerified: false });
    const res = await post('/auth/oauth', { provider: 'google', idToken: 'google-unverified' });
    expect(res.statusCode).toBe(400);
  });
});

describe('sessions', () => {
  it('le refresh token donne une nouvelle paire, et ne sert qu’une fois', async () => {
    const { tokens } = await signInByEmail();
    const refreshed = await post('/auth/refresh', { refreshToken: tokens.refreshToken });
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.json().refreshToken).not.toBe(tokens.refreshToken);

    // Réutiliser l'ancien jeton (vol probable) coupe toute la connexion…
    expect((await post('/auth/refresh', { refreshToken: tokens.refreshToken })).statusCode).toBe(
      401,
    );
    // …y compris le jeton qui venait d'être délivré.
    const stolen = await post('/auth/refresh', { refreshToken: refreshed.json().refreshToken });
    expect(stolen.statusCode).toBe(401);
  });

  it('jeton d’accès valable 15 minutes', async () => {
    const { tokens } = await signInByEmail();
    const me = () =>
      t.app.inject({
        method: 'GET',
        url: '/me',
        headers: { authorization: `Bearer ${tokens.accessToken}` },
      });
    expect((await me()).statusCode).toBe(403); // reconnu (profil à compléter)
    later(15 * 60 + 1);
    expect((await me()).statusCode).toBe(401);
  });

  it('refresh token expiré après 30 jours', async () => {
    const { tokens } = await signInByEmail();
    later(30 * 86_400 + 1);
    expect((await post('/auth/refresh', { refreshToken: tokens.refreshToken })).statusCode).toBe(
      401,
    );
  });

  it('déconnexion : le refresh token ne marche plus', async () => {
    const { tokens } = await signInByEmail();
    const out = await post(
      '/auth/logout',
      { refreshToken: tokens.refreshToken },
      tokens.accessToken,
    );
    expect(out.statusCode).toBe(200);
    expect((await post('/auth/refresh', { refreshToken: tokens.refreshToken })).statusCode).toBe(
      401,
    );
  });
});
