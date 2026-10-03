import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

// Refresh token : 256 bits aléatoires, en base64url. Seul son hachage est stocké.
export const randomToken = () => randomBytes(32).toString('base64url');

// Code de connexion à 6 chiffres (000000 à 999999).
export const randomCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

// Comparaison en temps constant de deux hachages hexadécimaux.
export function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}
