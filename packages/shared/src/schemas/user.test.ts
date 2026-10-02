import { describe, expect, it } from 'vitest';
import { makeOnboardingProfileSchema } from './user';

const schema = makeOnboardingProfileSchema(() => new Date('2026-10-07T10:00:00Z'));
const valid = {
  firstName: '  Awa ',
  birthDate: '2004-03-12',
  status: 'student',
  neighborhood: 'fann',
  interests: ['beach', 'music', 'cinema'],
};

describe('profil d’onboarding', () => {
  it('accepte un profil valide et nettoie le prénom', () => {
    expect(schema.parse(valid).firstName).toBe('Awa');
  });
  it('accepte le jour exact des 18 ans', () => {
    expect(schema.safeParse({ ...valid, birthDate: '2008-10-07' }).success).toBe(true);
  });
  it('refuse la veille des 18 ans avec errors.age_min', () => {
    const r = schema.safeParse({ ...valid, birthDate: '2008-10-08' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('errors.age_min');
  });
  it('refuse moins de 3 centres d’intérêt', () => {
    expect(schema.safeParse({ ...valid, interests: ['beach', 'music'] }).success).toBe(false);
  });
  it('refuse les centres d’intérêt en double', () => {
    expect(schema.safeParse({ ...valid, interests: ['beach', 'beach', 'music'] }).success).toBe(
      false,
    );
  });
  it('refuse un quartier inconnu', () => {
    expect(schema.safeParse({ ...valid, neighborhood: 'paris' }).success).toBe(false);
  });
});
