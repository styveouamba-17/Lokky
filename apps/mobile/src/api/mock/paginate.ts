import { LIMITS, type Paginated } from '@lokky/shared';
import { ApiError } from '../errors';

export function paginate<T>(items: T[], cursor?: string, limit?: number): Paginated<T> {
  const size = limit ?? LIMITS.pagination.defaultLimit;
  const offset = cursor === undefined ? 0 : Number(cursor);
  if (!Number.isInteger(offset) || offset < 0) {
    throw new ApiError('validation', 'Curseur invalide.', 400);
  }
  const end = offset + size;
  return { items: items.slice(offset, end), nextCursor: end < items.length ? String(end) : null };
}
