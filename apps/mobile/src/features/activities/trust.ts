import type { TrustStats } from '@lokky/shared';

// « Créateur fiable » : bien noté, sur assez d'avis pour que la note ait du sens.
export const TRUSTED_MIN_RATING = 4.5;
export const TRUSTED_MIN_REVIEWS = 3;

export const isTrustedCreator = (trust: TrustStats) =>
  trust.creatorRating !== null &&
  trust.creatorRating >= TRUSTED_MIN_RATING &&
  trust.creatorReviewCount >= TRUSTED_MIN_REVIEWS;

export const formatRate = (rate: number) => `${Math.round(rate * 100)} %`;
