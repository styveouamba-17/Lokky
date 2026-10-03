import { randomBytes } from 'node:crypto';

// UUID v7 : triable dans le temps (index plus compacts, ordre de création lisible).
// PostgreSQL 17 n'a pas encore de fonction intégrée : on les génère ici.
export function uuidv7(now: number = Date.now()): string {
  const bytes = randomBytes(16);
  bytes.writeUIntBE(now, 0, 6); // 48 bits de millisecondes
  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variante RFC 4122
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
