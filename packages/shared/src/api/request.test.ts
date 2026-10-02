import { describe, expect, it } from 'vitest';
import { buildRequest, pathParams, toQueryString } from './request';

describe('pathParams', () => {
  it('liste les paramètres du chemin', () => {
    expect(pathParams('/conversations/:conversationId/messages')).toEqual(['conversationId']);
    expect(pathParams('/activities')).toEqual([]);
  });
});

describe('buildRequest', () => {
  it('remplace et encode les paramètres de chemin', () => {
    const r = buildRequest({ method: 'GET', path: '/users/:id' }, { id: 'u 1/2' });
    expect(r).toEqual({ method: 'GET', path: '/users/u%201%2F2', query: null, body: null });
  });
  it('envoie le reste en query pour un GET, sans les valeurs undefined', () => {
    const r = buildRequest(
      { method: 'GET', path: '/activities' },
      { when: 'tonight', categories: ['sport', 'beach'], freeOnly: true, cursor: undefined },
    );
    expect(r.query).toEqual({ when: 'tonight', categories: ['sport', 'beach'], freeOnly: true });
    expect(r.body).toBeNull();
  });
  it('envoie le reste en body pour un POST', () => {
    const r = buildRequest(
      { method: 'POST', path: '/conversations/:conversationId/messages' },
      { conversationId: 'c1', clientId: 'abc12345', body: 'Salut' },
    );
    expect(r.path).toBe('/conversations/c1/messages');
    expect(r.body).toEqual({ clientId: 'abc12345', body: 'Salut' });
    expect(r.query).toBeNull();
  });
  it('échoue si un paramètre de chemin manque', () => {
    expect(() => buildRequest({ method: 'GET', path: '/users/:id' }, {})).toThrow(/id/);
  });
  it('échoue sur un objet imbriqué en query', () => {
    expect(() =>
      buildRequest({ method: 'GET', path: '/activities' }, { near: { lat: 1, lng: 2 } }),
    ).toThrow(/near/);
  });
});

describe('toQueryString', () => {
  it('répète les clés de tableau et encode les valeurs', () => {
    expect(toQueryString({ categories: ['sport', 'beach'], q: 'thé & jeux', limit: 20 })).toBe(
      'categories=sport&categories=beach&q=th%C3%A9%20%26%20jeux&limit=20',
    );
  });
});
