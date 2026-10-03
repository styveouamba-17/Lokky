import { routes } from '@lokky/shared';
import { afterEach, describe, expect, it } from 'vitest';
import type { Handlers } from '../src/http/context';
import { HttpError } from '../src/http/errors';
import { createTestApp } from './helpers';

const moussa = {
  id: 'u_moussa',
  firstName: 'Moussa',
  avatarUrl: null,
  status: 'newcomer' as const,
  neighborhood: 'yoff' as const,
  interests: ['sport' as const],
  trust: {
    activitiesAttended: 1,
    attendanceRate: 1,
    activitiesCreated: 0,
    creatorRating: null,
    creatorReviewCount: 0,
  },
  relationship: { canMessage: false, isBlocked: false },
};

let close: (() => Promise<void>) | null = null;
afterEach(async () => {
  await close?.();
  close = null;
});

// Jeton « ok » : Awa est connectée (un identifiant au format réel). Tout autre jeton est refusé.
const AWA = '01a10000-0000-7000-8000-000000000001';
async function setup(handlers: Handlers) {
  const test = await createTestApp({
    handlers,
    authenticate: async (token) => (token === 'ok' ? AWA : null),
  });
  close = test.close;
  return test.app;
}

const auth = { authorization: 'Bearer ok' };

describe('routes générées depuis le contrat', () => {
  it('enregistre chaque route du contrat', async () => {
    const app = await setup({});
    for (const def of Object.values(routes)) {
      expect(app.hasRoute({ method: def.method, url: def.path }), def.path).toBe(true);
    }
  });

  it('une route sans handler répond 501', async () => {
    const app = await setup({});
    const res = await app.inject({ method: 'GET', url: '/users/u_moussa', headers: auth });
    expect(res.statusCode).toBe(501);
    expect(res.json()).toEqual({
      error: { code: 'internal', message: 'Route pas encore disponible : users.get' },
    });
  });

  it('route authentifiée sans jeton valide : 401 unauthorized', async () => {
    const app = await setup({ 'users.get': () => moussa });
    const none = await app.inject({ method: 'GET', url: '/users/u_moussa' });
    expect(none.statusCode).toBe(401);
    expect(none.json().error.code).toBe('unauthorized');
    const bad = await app.inject({
      method: 'GET',
      url: '/users/u_moussa',
      headers: { authorization: 'Bearer faux' },
    });
    expect(bad.statusCode).toBe(401);
  });

  it('paramètres de chemin et spectateur transmis au handler', async () => {
    const seen: unknown[] = [];
    const app = await setup({
      'users.get': (input, ctx) => {
        seen.push(input, ctx.viewerId);
        return moussa;
      },
    });
    const res = await app.inject({ method: 'GET', url: '/users/u_moussa', headers: auth });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(moussa);
    expect(seen).toEqual([{ id: 'u_moussa' }, AWA]);
  });

  it('requête GET : nombres, booléens et tableaux reconvertis avant validation', async () => {
    let received: unknown = null;
    const app = await setup({
      'activities.list': (input) => {
        received = input;
        return { items: [], nextCursor: null };
      },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/activities?lat=14.69&lng=-17.46&freeOnly=true&categories=sport',
      headers: auth,
    });
    expect(res.statusCode).toBe(200);
    expect(received).toEqual({ lat: 14.69, lng: -17.46, freeOnly: true, categories: ['sport'] });
  });

  it('entrée invalide : 400 validation, avec le champ en cause', async () => {
    const app = await setup({ 'reviews.create': () => ({ ok: true }) });
    const res = await app.inject({
      method: 'POST',
      url: '/activities/a_foot/reviews',
      headers: auth,
      payload: { creatorRating: 9 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('validation');
    expect(res.json().error.message).toMatch(/^creatorRating/);
  });

  it('route publique : pas de jeton nécessaire, corps validé et normalisé', async () => {
    let received: unknown = null;
    const app = await setup({
      'auth.emailStart': (input) => {
        received = input;
        return { ok: true };
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/auth/email/start',
      payload: { email: '  Awa@Exemple.SN ' },
    });
    expect(res.statusCode).toBe(200);
    expect(received).toEqual({ email: 'awa@exemple.sn' });
  });

  it('erreur métier : code et statut du contrat', async () => {
    const app = await setup({
      'activities.join': () => {
        throw new HttpError('activity_full', 'Activité complète.');
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/activities/a_foot/join',
      headers: auth,
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: { code: 'activity_full', message: 'Activité complète.' } });
  });

  it('réponse hors contrat : erreur 500 (mode strict)', async () => {
    const app = await setup({ 'users.get': () => ({ ...moussa, firstName: '' }) });
    const res = await app.inject({ method: 'GET', url: '/users/u_moussa', headers: auth });
    expect(res.statusCode).toBe(500);
    expect(res.json().error.message).toBe('Réponse hors contrat pour users.get.');
  });

  it('erreur inattendue : 500 sans détail interne', async () => {
    const app = await setup({
      'users.get': () => {
        throw new Error('connexion perdue à 10.0.0.3');
      },
    });
    const res = await app.inject({ method: 'GET', url: '/users/u_moussa', headers: auth });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: { code: 'internal', message: 'Erreur interne.' } });
  });

  it('JSON mal formé et route inconnue', async () => {
    const app = await setup({});
    const bad = await app.inject({
      method: 'POST',
      url: '/auth/email/start',
      headers: { 'content-type': 'application/json' },
      payload: '{ pas du json',
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error.code).toBe('validation');
    const missing = await app.inject({ method: 'GET', url: '/nulle-part' });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error.code).toBe('not_found');
  });
});
