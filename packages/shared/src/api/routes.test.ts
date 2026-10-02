import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { pathParams } from './request';
import { routes } from './routes';

describe('table des routes', () => {
  it('chaque paramètre de chemin existe dans le schéma d’entrée', () => {
    for (const [name, def] of Object.entries(routes)) {
      expect(def.input, name).toBeInstanceOf(z.ZodObject);
      const keys = Object.keys((def.input as z.ZodObject).shape);
      for (const param of pathParams(def.path)) {
        expect(keys, `${name} : paramètre « ${param} »`).toContain(param);
      }
    }
  });

  it('aucune paire méthode + chemin n’est déclarée deux fois', () => {
    const seen = Object.values(routes).map((d) => `${d.method} ${d.path}`);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('seules les routes de connexion sont publiques', () => {
    const publicRoutes = Object.entries(routes)
      .filter(([, d]) => !d.auth)
      .map(([n]) => n)
      .sort();
    expect(publicRoutes).toEqual([
      'auth.emailStart',
      'auth.emailVerify',
      'auth.oauth',
      'auth.refresh',
    ]);
  });
});
