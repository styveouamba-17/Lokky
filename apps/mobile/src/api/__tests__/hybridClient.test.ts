import { ApiError } from '../errors';
import { createHybridClient } from '../hybridClient';
import type { ApiClient } from '../types';

const client = (impl: ApiClient['request']): ApiClient => ({ request: impl });

describe('client hybride', () => {
  it('utilise le vrai backend quand il connaît la route', async () => {
    const http = client(jest.fn().mockResolvedValue({ ok: true }));
    const mock = client(jest.fn());
    await expect(
      createHybridClient(http, mock).request('auth.emailStart', { email: 'a@b.sn' }),
    ).resolves.toEqual({ ok: true });
    expect(mock.request).not.toHaveBeenCalled();
  });

  it('route pas encore disponible (501) : la simulation prend le relais', async () => {
    const http = client(
      jest.fn().mockRejectedValue(new ApiError('internal', 'Route pas encore disponible', 501)),
    );
    const mock = client(jest.fn().mockResolvedValue({ items: [], nextCursor: null }));
    await expect(createHybridClient(http, mock).request('activities.list', {})).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('les vraies erreurs du backend remontent telles quelles', async () => {
    const http = client(jest.fn().mockRejectedValue(new ApiError('validation', 'Code faux', 400)));
    const mock = client(jest.fn());
    await expect(
      createHybridClient(http, mock).request('auth.emailVerify', {
        email: 'a@b.sn',
        code: '123456',
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    expect(mock.request).not.toHaveBeenCalled();
  });
});
