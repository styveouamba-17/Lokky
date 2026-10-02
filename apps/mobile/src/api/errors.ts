import type { ApiErrorCode } from '@lokky/shared';

export type ClientErrorCode = ApiErrorCode | 'network' | 'timeout' | 'invalid_response';

export class ApiError extends Error {
  readonly code: ClientErrorCode;
  readonly status: number | null;

  constructor(code: ClientErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

const RETRYABLE: readonly ClientErrorCode[] = ['network', 'timeout', 'internal', 'rate_limited'];
export const isRetryable = (error: unknown) => isApiError(error) && RETRYABLE.includes(error.code);
