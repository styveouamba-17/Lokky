import { parseEnv } from '../env';

describe('parseEnv', () => {
  it('passe en mode simulé par défaut en développement', () => {
    expect(parseEnv({}, true)).toEqual({ apiMode: 'mock', apiUrl: null });
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
});
