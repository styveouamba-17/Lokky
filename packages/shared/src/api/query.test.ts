import { describe, expect, it } from 'vitest';
import { parseQuery, type RawQuery } from './query';
import { buildRequest, toQueryString } from './request';
import { routes } from './routes';

// Reproduit ce que fait un serveur HTTP : la chaîne de requête redevient des chaînes.
function decode(qs: string): RawQuery {
  const out: RawQuery = {};
  for (const pair of qs.split('&').filter(Boolean)) {
    const [k, v = ''] = pair.split('=').map(decodeURIComponent) as [string, string?];
    const prev = out[k];
    out[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  return out;
}

describe('parseQuery', () => {
  const def = routes['activities.list'];

  it('aller-retour avec toQueryString : nombres, booléens, tableaux', () => {
    const input = {
      when: 'tonight' as const,
      lat: 14.69,
      lng: -17.46,
      radiusKm: 5,
      freeOnly: true,
      categories: ['sport', 'beach'] as ('sport' | 'beach')[],
      limit: 10,
    };
    const req = buildRequest(def, input);
    const parsed = parseQuery(def.input, decode(toQueryString(req.query ?? {})));
    expect(def.input.parse(parsed)).toEqual(input);
  });

  it('un tableau d’un seul élément reste un tableau', () => {
    expect(parseQuery(def.input, { categories: 'sport' })).toEqual({ categories: ['sport'] });
  });

  it('une valeur mal formée est laissée telle quelle, pour que zod la refuse', () => {
    const parsed = parseQuery(def.input, { lat: 'abc', freeOnly: 'oui' });
    expect(parsed).toEqual({ lat: 'abc', freeOnly: 'oui' });
    expect(def.input.safeParse(parsed).success).toBe(false);
  });

  it('les chaînes restent des chaînes (curseur, portée)', () => {
    const mine = routes['activities.mine'];
    expect(parseQuery(mine.input, { scope: 'past', cursor: 'abc', limit: '20' })).toEqual({
      scope: 'past',
      cursor: 'abc',
      limit: 20,
    });
  });
});
