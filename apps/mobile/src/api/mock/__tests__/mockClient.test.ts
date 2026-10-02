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
    await expect(makeClient().request('me.get', {})).rejects.toThrow(/Route non simulée : me.get/);
  });

  it('simule une panne réseau selon failureRate', async () => {
    const error = await makeClient({ failureRate: 1 })
      .request('activities.get', { id: 'a_foot' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'network' });
  });
});
