import { parseEnv } from '../env';
import { API_URL } from '../configurl';

describe('parseEnv', () => {
  it('priorise l’URL Render configurée à celle de Metro', () => {
    expect(parseEnv({ apiMode: 'http', apiUrl: API_URL }, true, '192.168.1.48:8081')).toEqual({
      apiMode: 'http',
      apiUrl: 'https://lokky.onrender.com',
    });
  });

  it('utilise le vrai backend local par défaut en développement', () => {
    expect(parseEnv({}, true, '192.168.1.48:8081')).toEqual({
      apiMode: 'http',
      apiUrl: 'http://192.168.1.48:3000',
    });
  });
  it('échoue sans mode explicite hors développement', () => {
    expect(() => parseEnv({}, false)).toThrow(/EXPO_PUBLIC_API_MODE/);
  });
  it('échoue sur un mode inconnu', () => {
    expect(() => parseEnv({ apiMode: 'prod' }, true)).toThrow(/EXPO_PUBLIC_API_MODE/);
  });
  it('échoue en mode http sans URL', () => {
    expect(() => parseEnv({ apiMode: 'http' }, true)).toThrow(/EXPO_PUBLIC_API_URL/);
  });
  it('échoue en mode http avec une URL sans protocole', () => {
    expect(() => parseEnv({ apiMode: 'http', apiUrl: 'api.lokky.sn' }, false)).toThrow(
      /EXPO_PUBLIC_API_URL/,
    );
  });
  it('retire la barre finale de l’URL', () => {
    expect(parseEnv({ apiMode: 'http', apiUrl: ' https://api.lokky.sn/v1/ ' }, false)).toEqual({
      apiMode: 'http',
      apiUrl: 'https://api.lokky.sn/v1',
    });
  });

  it('en développement, sans URL : l’API sur la machine de Metro, port 3000', () => {
    expect(parseEnv({ apiMode: 'http' }, true, '192.168.1.48:8081')).toEqual({
      apiMode: 'http',
      apiUrl: 'http://192.168.1.48:3000',
    });
  });
  it('le port de l’API locale peut changer', () => {
    expect(parseEnv({ apiMode: 'http', apiPort: '4000' }, true, '10.0.0.5:8081').apiUrl).toBe(
      'http://10.0.0.5:4000',
    );
  });
  it('une URL explicite passe avant l’adresse de Metro', () => {
    expect(
      parseEnv({ apiMode: 'http', apiUrl: 'https://api.lokky.app' }, true, '192.168.1.48:8081')
        .apiUrl,
    ).toBe('https://api.lokky.app');
  });
  it('hors développement, jamais de déduction : l’URL reste obligatoire', () => {
    expect(() => parseEnv({ apiMode: 'http' }, false, '192.168.1.48:8081')).toThrow(
      /EXPO_PUBLIC_API_URL/,
    );
  });

  it('mode hybride en développement, avec l’adresse de Metro', () => {
    expect(parseEnv({ apiMode: 'hybrid' }, true, '192.168.1.48:8081')).toEqual({
      apiMode: 'hybrid',
      apiUrl: 'http://192.168.1.48:3000',
    });
  });
  it('mode hybride refusé hors développement', () => {
    expect(() => parseEnv({ apiMode: 'hybrid', apiUrl: 'https://api.lokky.app' }, false)).toThrow(
      /développement/,
    );
  });
});
