import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createActivity, createMember } from './factories';
import { createTestApp, resetDatabase } from './helpers';

// Correctifs issus de la revue de sécurité.
const NOW = new Date('2026-10-07T10:00:00Z');
const at = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000);

let t: Awaited<ReturnType<typeof createTestApp>>;
let clock = NOW;
beforeAll(async () => {
  t = await createTestApp({ now: () => clock });
});
afterAll(() => t.close());
beforeEach(async () => {
  clock = NOW;
  await resetDatabase(t.db);
});

describe('revue de sécurité', () => {
  it('blocage : ni les sorties ni la liste des sorties de l’autre par lien direct', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await moussa.call('POST', '/me/blocks', { userId: awa.id });

    expect((await awa.call('GET', `/activities/${id}`)).statusCode).toBe(404);
    expect((await awa.call('GET', `/activities/${id}/participants`)).statusCode).toBe(404);
    expect((await awa.call('POST', `/activities/${id}/join`)).statusCode).toBe(404);
    expect((await awa.call('GET', `/users/${moussa.id}/activities`)).statusCode).toBe(404);
    // Le créateur voit toujours sa propre sortie.
    expect((await moussa.call('GET', `/activities/${id}`)).statusCode).toBe(200);
  });

  it('la date de naissance ne change plus après l’onboarding', async () => {
    const awa = await createMember(t, 'Awa');
    const res = await awa.call('POST', '/me/onboarding', {
      firstName: 'Awa',
      birthDate: '1990-01-01',
      status: 'student',
      neighborhood: 'fann',
      interests: ['beach', 'music', 'cinema'],
    });
    expect(res.json().birthDate).toBe('2000-01-01');
  });

  it('modifier une sortie : la date reste dans les bornes', async () => {
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, awa.id, { startsAt: at(26) });
    const past = await awa.call('PATCH', `/activities/${id}`, { startsAt: at(-2).toISOString() });
    expect(past.statusCode).toBe(400);
  });

  it('codes email : au plus 5 par heure et par adresse', async () => {
    const start = () =>
      t.app.inject({
        method: 'POST',
        url: '/auth/email/start',
        payload: { email: 'cible@exemple.sn' },
      });
    for (let i = 0; i < 5; i += 1) {
      expect((await start()).statusCode).toBe(200);
      clock = new Date(clock.getTime() + 61_000);
    }
    const sixth = await start();
    expect(sixth.statusCode).toBe(429);
    clock = new Date(NOW.getTime() + 61 * 60_000);
    expect((await start()).statusCode).toBe(200);
  });
});
