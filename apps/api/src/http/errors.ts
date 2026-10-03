import type { ApiErrorCode } from '@lokky/shared';

// Erreurs métier renvoyées au format du contrat : { error: { code, message } }.
// Le code HTTP découle du code d'erreur : un module n'a qu'à choisir le bon code.
export const ERROR_STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 400,
  conflict: 409,
  activity_full: 409,
  activity_started: 409,
  not_participant: 403,
  rate_limited: 429,
  account_suspended: 403,
  account_banned: 403,
  onboarding_required: 403,
  internal: 500,
};

export class HttpError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number = ERROR_STATUS[code]) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
    this.status = status;
  }
}

export const errorBody = (code: ApiErrorCode, message: string) => ({ error: { code, message } });
