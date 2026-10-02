import { describe, expect, it } from 'vitest';
import { reportInputSchema, reviewInputSchema } from './safety';

describe('signalement', () => {
  const base = { targetType: 'user', targetId: 'u1' };
  it('accepte un motif précis sans détails', () => {
    expect(reportInputSchema.safeParse({ ...base, reason: 'harassment' }).success).toBe(true);
  });
  it('exige au moins 10 caractères de détails pour « autre »', () => {
    expect(reportInputSchema.safeParse({ ...base, reason: 'other', details: 'bof' }).success).toBe(
      false,
    );
    expect(
      reportInputSchema.safeParse({ ...base, reason: 'other', details: 'Comportement bizarre' })
        .success,
    ).toBe(true);
  });
});

describe('avis', () => {
  it('refuse une note hors de 1 à 5', () => {
    expect(reviewInputSchema.safeParse({ activityId: 'a1', creatorRating: 0 }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ activityId: 'a1', creatorRating: 6 }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ activityId: 'a1', creatorRating: 5 }).success).toBe(true);
  });
});
