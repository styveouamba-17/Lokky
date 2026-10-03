import { HttpError } from '../http/errors';

// Curseurs de pagination opaques (spec backend §3) : l'app les renvoie tels quels.
export function encodeCursor(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function decodeCursor<T>(
  cursor: string | undefined,
  isValid: (v: unknown) => v is T,
): T | null {
  if (cursor === undefined) return null;
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (isValid(value)) return value;
  } catch {
    // curseur illisible : même réponse qu'un curseur mal formé
  }
  throw new HttpError('validation', 'cursor : curseur invalide.');
}

export const isOffset = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
