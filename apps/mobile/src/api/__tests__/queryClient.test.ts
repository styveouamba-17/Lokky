import { ApiError } from '../errors';
import { shouldRetry } from '../queryClient';

describe('shouldRetry', () => {
  it('relance les erreurs réseau, timeout et serveur, deux fois au plus', () => {
    expect(shouldRetry(0, new ApiError('network', 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError('timeout', 'x'))).toBe(true);
    expect(shouldRetry(0, new ApiError('internal', 'x', 500))).toBe(true);
    expect(shouldRetry(2, new ApiError('network', 'x'))).toBe(false);
  });
  it('ne relance pas les erreurs métier ni les erreurs inconnues', () => {
    expect(shouldRetry(0, new ApiError('not_found', 'x', 404))).toBe(false);
    expect(shouldRetry(0, new ApiError('activity_full', 'x', 409))).toBe(false);
    expect(shouldRetry(0, new Error('bug'))).toBe(false);
  });
});
