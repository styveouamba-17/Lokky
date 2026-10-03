import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

const valid = {
  DATABASE_URL: 'postgres://lokky:lokky@localhost:5434/lokky',
  REDIS_URL: 'redis://localhost:6380',
  PUBLIC_WEB_ORIGIN: 'https://lokky.akylian.com',
  JWT_PRIVATE_KEY: 'clé de test',
};

describe('configuration', () => {
  it('valeurs par défaut pour le port et l’environnement', () => {
    expect(loadConfig(valid)).toMatchObject({ PORT: 3000, NODE_ENV: 'development' });
  });

  it('refuse de démarrer sans base de données, en listant ce qui manque', () => {
    expect(() => loadConfig({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it('en production, les emails doivent pouvoir partir (clé Resend obligatoire)', () => {
    expect(() => loadConfig({ ...valid, NODE_ENV: 'production' })).toThrow(/RESEND_API_KEY/);
  });
});
