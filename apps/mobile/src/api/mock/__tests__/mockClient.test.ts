import { ApiError } from '../../errors';
import { createMockDb } from '../db';
import { mockHandlers } from '../handlers';
import { createMockClient } from '../mockClient';

// Mercredi 7 octobre 2026, 10h (Dakar). Samedi = 10 oct., dimanche = 11 oct.
const NOW = new Date('2026-10-07T10:00:00Z');
const UCAD = { lat: 14.6925, lng: -17.4625 };

function makeClient(overrides: { failureRate?: number; handlers?: typeof mockHandlers } = {}) {
  return createMockClient({
    handlers: overrides.handlers ?? mockHandlers,
    db: createMockDb(NOW),
    now: () => NOW,
    sleep: () => Promise.resolve(),
    random: () => 0.5,
    failureRate: overrides.failureRate ?? 0,
  });
}

const ids = (page: { items: { id: string }[] }) => page.items.map((a) => a.id);

describe('client simulé : activités', () => {
  it('« ce soir » ne renvoie que les activités du jour, triées par heure', async () => {
    const page = await makeClient().request('activities.list', { when: 'tonight' });
    expect(ids(page)).toEqual(['a_foot', 'a_cine']);
  });

  it('« ce week-end » renvoie samedi et dimanche', async () => {
    const page = await makeClient().request('activities.list', { when: 'weekend' });
    expect(ids(page)).toEqual(['a_mamelles', 'a_concert', 'a_ngor']);
  });

  it('« gratuit » exclut les activités payantes', async () => {
    const page = await makeClient().request('activities.list', { when: 'tonight', freeOnly: true });
    expect(ids(page)).toEqual(['a_foot']);
  });

  it('exclut les activités passées et annulées', async () => {
    const page = await makeClient().request('activities.list', { limit: 50 });
    expect(ids(page)).not.toContain('a_footing');
    expect(ids(page)).not.toContain('a_goree');
    expect(page.items).toHaveLength(9);
  });

  it('filtre par distance et calcule distanceKm', async () => {
    const page = await makeClient().request('activities.list', { ...UCAD, radiusKm: 3 });
    expect(ids(page)).toEqual(['a_cine', 'a_bu', 'a_jeux', 'a_thieb']);
    expect(page.items.find((a) => a.id === 'a_bu')?.distanceKm).toBe(0);
  });

  it('pagine avec un curseur', async () => {
    const client = makeClient();
    const p1 = await client.request('activities.list', { limit: 4 });
    expect(p1.items).toHaveLength(4);
    expect(p1.nextCursor).toBe('4');
    const p3 = await client.request('activities.list', { limit: 4, cursor: '8' });
    expect(p3.items).toHaveLength(1);
    expect(p3.nextCursor).toBeNull();
  });

  it('refuse un curseur invalide', async () => {
    await expect(makeClient().request('activities.list', { cursor: 'abc' })).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('calcule l’état de l’utilisateur courant', async () => {
    const client = makeClient();
    const full = await client.request('activities.get', { id: 'a_concert' });
    expect(full.viewerState).toMatchObject({ isParticipant: false, canJoin: false });
    const mine = await client.request('activities.get', { id: 'a_thieb' });
    expect(mine.viewerState).toMatchObject({ isCreator: true, canLeave: false });
    const past = await client.request('activities.get', { id: 'a_footing' });
    expect(past.status).toBe('past');
    expect(past.viewerState.canReview).toBe(true);
    const cancelled = await client.request('activities.get', { id: 'a_goree' });
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.viewerState.canJoin).toBe(false);
  });

  it('compte les participants qui découvrent Lokky', async () => {
    const foot = await makeClient().request('activities.get', { id: 'a_foot' });
    expect(foot.firstTimerCount).toBe(1);
  });

  it('renvoie not_found pour une activité inconnue', async () => {
    await expect(makeClient().request('activities.get', { id: 'nope' })).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});

describe('client simulé : comportement général', () => {
  it('chaque activité du jeu de données respecte le contrat', async () => {
    const client = makeClient();
    for (const id of ['a_foot', 'a_footing', 'a_goree', 'a_concert']) {
      await expect(client.request('activities.get', { id })).resolves.toBeDefined();
    }
  });

  it('signale clairement une route non simulée', async () => {
    await expect(makeClient().request('activities.cancel', { id: 'a_foot' })).rejects.toThrow(
      /Route non simulée : activities.cancel/,
    );
  });

  it('simule une panne réseau selon failureRate', async () => {
    const error = await makeClient({ failureRate: 1 })
      .request('activities.get', { id: 'a_foot' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'network' });
  });
});

describe('client simulé : connexion', () => {
  it('envoie un code à un email normalisé', async () => {
    await expect(
      makeClient().request('auth.emailStart', { email: '  Awa@Exemple.COM ' }),
    ).resolves.toEqual({ ok: true });
  });

  it('refuse un email invalide avant même l’appel', async () => {
    await expect(makeClient().request('auth.emailStart', { email: 'awa' })).rejects.toThrow();
  });

  it('Apple / Google : accepte le jeton et ouvre un nouveau compte (onboarding à faire)', async () => {
    const result = await makeClient().request('auth.oauth', {
      provider: 'google',
      idToken: 'jeton-google',
    });
    expect(result.user).toBeNull();
    expect(result.tokens.accessToken).not.toBe(result.tokens.refreshToken);
    expect(result.tokens.expiresIn).toBe(15 * 60);
  });

  it('code email : 123456 ouvre la session, un autre code est refusé', async () => {
    const client = makeClient();
    const email = 'awa@exemple.com';
    await expect(
      client.request('auth.emailVerify', { email, code: '000000' }),
    ).rejects.toMatchObject({ code: 'validation' });
    const result = await client.request('auth.emailVerify', { email, code: '123 456' });
    expect(result.tokens.accessToken).toMatch(/^mock-access-/);
  });
});

describe('client simulé : compte', () => {
  const PROFILE = {
    firstName: 'Moussa',
    birthDate: '2001-05-20',
    status: 'newcomer' as const,
    neighborhood: 'ouakam' as const,
    interests: ['sport' as const, 'food' as const, 'walk' as const],
  };

  it('GET /me répond onboarding_required tant que le profil n’est pas rempli', async () => {
    const client = makeClient();
    await expect(client.request('me.get', {})).rejects.toMatchObject({
      code: 'onboarding_required',
    });
  });

  it('après l’onboarding, le profil est renvoyé par /me et par la connexion', async () => {
    const client = makeClient();
    const me = await client.request('me.completeOnboarding', PROFILE);
    expect(me).toMatchObject({ firstName: 'Moussa', neighborhood: 'ouakam' });
    await expect(client.request('me.get', {})).resolves.toMatchObject({ firstName: 'Moussa' });
    const again = await client.request('auth.oauth', { provider: 'apple', idToken: 'jeton' });
    expect(again.user?.firstName).toBe('Moussa');
  });

  it('refuse un profil de moins de 18 ans', async () => {
    const client = makeClient();
    await expect(
      client.request('me.completeOnboarding', { ...PROFILE, birthDate: '2015-01-01' }),
    ).rejects.toThrow();
  });
});

describe('client simulé : participation', () => {
  it('« Je viens ! » ajoute le spectateur, et la liste des participants suit', async () => {
    const client = makeClient();
    const joined = await client.request('activities.join', { id: 'a_cine' });
    expect(joined.viewerState).toMatchObject({
      isParticipant: true,
      canJoin: false,
      canLeave: true,
    });
    expect(joined.participantCount).toBe(4);
    const people = await client.request('activities.participants', { id: 'a_cine' });
    expect(people.map((p) => p.id)).toContain('u_awa');
  });

  it('refuse une activité complète', async () => {
    await expect(
      makeClient().request('activities.join', { id: 'a_concert' }),
    ).rejects.toMatchObject({ code: 'activity_full' });
  });

  it('on peut quitter avant le départ, mais pas sa propre sortie', async () => {
    const client = makeClient();
    const left = await client.request('activities.leave', { id: 'a_bu' });
    expect(left.viewerState.isParticipant).toBe(false);
    await expect(client.request('activities.leave', { id: 'a_thieb' })).rejects.toMatchObject({
      code: 'forbidden',
    });
    await expect(client.request('activities.leave', { id: 'a_foot' })).rejects.toMatchObject({
      code: 'not_participant',
    });
  });
});

describe('client simulé : création', () => {
  it('crée une sortie dont le spectateur est créateur et premier participant', async () => {
    const client = makeClient();
    const created = await client.request('activities.create', {
      title: 'Thé sur la Corniche',
      category: 'food',
      startsAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      location: {
        name: 'Corniche Ouest',
        coordinates: { lat: 14.693, lng: -17.475 },
        neighborhood: 'fann',
        meetingPoint: null,
      },
      capacity: 6,
      cost: { type: 'free' },
    });
    expect(created.viewerState).toMatchObject({ isCreator: true, isParticipant: true });
    expect(created.participantCount).toBe(1);
    await expect(client.request('activities.get', { id: created.id })).resolves.toMatchObject({
      title: 'Thé sur la Corniche',
    });
  });
});
