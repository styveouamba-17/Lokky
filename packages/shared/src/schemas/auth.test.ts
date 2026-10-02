import { describe, expect, it } from 'vitest';
import { emailStartInputSchema, emailVerifyInputSchema } from './auth';

describe('connexion par email', () => {
  it('normalise l’email (espaces, majuscules)', () => {
    expect(emailStartInputSchema.parse({ email: '  Awa@Gmail.COM ' }).email).toBe('awa@gmail.com');
  });
  it('refuse un email invalide', () => {
    expect(emailStartInputSchema.safeParse({ email: 'awa@' }).success).toBe(false);
  });
  it('accepte un code collé avec des espaces', () => {
    const r = emailVerifyInputSchema.parse({ email: 'awa@gmail.com', code: ' 123 456 ' });
    expect(r.code).toBe('123456');
  });
  it('refuse un code qui n’a pas 6 chiffres', () => {
    expect(emailVerifyInputSchema.safeParse({ email: 'a@b.sn', code: '12345' }).success).toBe(
      false,
    );
    expect(emailVerifyInputSchema.safeParse({ email: 'a@b.sn', code: 'abcdef' }).success).toBe(
      false,
    );
  });
});
