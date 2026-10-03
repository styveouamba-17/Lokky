import { ApiError } from '../errors';
import { createHttpClient, createSingleFlight } from '../httpClient';

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit]>;

const response = (body: unknown, status = 200, json = true) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: json ? async () => body : async () => Promise.reject(new SyntaxError('not json')),
  }) as unknown as Response;

const user = {
  id: 'u1',
  firstName: 'Awa',
  avatarUrl: null,
  status: 'student',
  neighborhood: 'fann',
  interests: ['beach'],
  trust: {
    activitiesAttended: 0,
    attendanceRate: null,
    activitiesCreated: 0,
    creatorRating: null,
    creatorReviewCount: 0,
  },
  relationship: { canMessage: false, isBlocked: false },
};

function setup(fetchImpl: (url: string, init: RequestInit) => Promise<Response>) {
  const fetchFn: FetchMock = jest.fn(fetchImpl);
  const client = createHttpClient({
    baseUrl: 'https://api.test',
    getAccessToken: () => 'tok',
    fetchFn: fetchFn as unknown as typeof fetch,
  });
  return { client, fetchFn };
}

describe('createHttpClient', () => {
  it('construit l’URL avec le paramètre de chemin et ajoute le jeton', async () => {
    const { client, fetchFn } = setup(async () => response(user));
    await expect(client.request('users.get', { id: 'u 1' })).resolves.toMatchObject({ id: 'u1' });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.test/users/u%201');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('sérialise les filtres en query', async () => {
    const { client, fetchFn } = setup(async () => response({ items: [], nextCursor: null }));
    await client.request('activities.list', {
      when: 'tonight',
      categories: ['sport', 'beach'],
      freeOnly: true,
    });
    expect(fetchFn.mock.calls[0]![0]).toBe(
      'https://api.test/activities?when=tonight&categories=sport&categories=beach&freeOnly=true',
    );
  });

  it('envoie un body normalisé et pas de jeton sur une route publique', async () => {
    const { client, fetchFn } = setup(async () => response({ ok: true }));
    await client.request('auth.emailStart', { email: ' Awa@Gmail.com ' });
    const init = fetchFn.mock.calls[0]![1];
    expect(init.body).toBe('{"email":"awa@gmail.com"}');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('transforme une erreur de l’API en ApiError avec son code', async () => {
    const { client } = setup(async () =>
      response({ error: { code: 'activity_full', message: 'Complet' } }, 409),
    );
    await expect(client.request('activities.join', { id: 'a1' })).rejects.toMatchObject({
      code: 'activity_full',
      status: 409,
    });
  });

  it('renvoie internal si le corps d’erreur n’est pas lisible', async () => {
    const { client } = setup(async () => response(null, 502, false));
    await expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
      code: 'internal',
      status: 502,
    });
  });

  it('refuse une réponse qui ne respecte pas le contrat', async () => {
    const { client } = setup(async () => response({ id: 'u1' }));
    await expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('renvoie network si la requête échoue', async () => {
    const { client } = setup(async () => {
      throw new TypeError('Network request failed');
    });
    await expect(client.request('users.get', { id: 'u1' })).rejects.toBeInstanceOf(ApiError);
    await expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
      code: 'network',
    });
  });

  it('abandonne au bout de 15 s avec timeout', async () => {
    jest.useFakeTimers();
    try {
      const { client } = setup(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      );
      const assertion = expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
        code: 'timeout',
      });
      await jest.advanceTimersByTimeAsync(15_000);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('jeton expiré (401)', () => {
  const unauthorized = () => response({ error: { code: 'unauthorized', message: 'expiré' } }, 401);

  it('rafraîchit le jeton puis rejoue la requête une fois', async () => {
    const refreshAccessToken = jest.fn(async () => 'neuf');
    const fetchFn = jest.fn(async (_url: string, init: RequestInit) =>
      (init.headers as Record<string, string>).Authorization === 'Bearer neuf'
        ? response(user)
        : unauthorized(),
    );
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => 'vieux',
      refreshAccessToken,
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    await expect(client.request('users.get', { id: 'u1' })).resolves.toMatchObject({ id: 'u1' });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('session perdue : unauthorized, sans boucler', async () => {
    const fetchFn = jest.fn(async () => unauthorized());
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => 'vieux',
      refreshAccessToken: async () => null,
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    await expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('une route publique ne tente pas de rafraîchir', async () => {
    const refreshAccessToken = jest.fn(async () => 'neuf');
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => null,
      refreshAccessToken,
      fetchFn: (async () => unauthorized()) as unknown as typeof fetch,
    });
    await expect(
      client.request('auth.emailStart', { email: 'awa@exemple.com' }),
    ).rejects.toMatchObject({ code: 'unauthorized' });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});

describe('createSingleFlight', () => {
  it('dix appels simultanés ne déclenchent qu’un seul rafraîchissement', async () => {
    let release: (value: string) => void = () => undefined;
    const task = jest.fn(() => new Promise<string>((resolve) => (release = resolve)));
    const once = createSingleFlight(task);
    const calls = Array.from({ length: 10 }, () => once());
    release('jeton');
    await expect(Promise.all(calls)).resolves.toEqual(Array(10).fill('jeton'));
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('repart de zéro une fois la tâche terminée', async () => {
    const task = jest.fn(async () => 'ok');
    const once = createSingleFlight(task);
    await once();
    await once();
    expect(task).toHaveBeenCalledTimes(2);
  });
});
