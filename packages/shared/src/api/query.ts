import { z } from 'zod';

// Inverse de toQueryString (request.ts), côté serveur : dans l'URL, tout est texte.
// On reconvertit chaque paramètre selon le type attendu par le schéma d'entrée de la route
// (nombre, booléen, tableau), puis zod valide normalement. Un paramètre inconnu ou mal formé
// est laissé tel quel : la validation le refusera avec un message clair.

export type RawQuery = Record<string, string | string[] | undefined>;

// Retire les enveloppes optional / default / nullable pour trouver le type de base.
function unwrap(schema: z.ZodType): z.ZodType {
  let current: z.ZodType = schema;
  while (
    current instanceof z.ZodOptional ||
    current instanceof z.ZodNullable ||
    current instanceof z.ZodDefault
  ) {
    current = current.unwrap() as z.ZodType;
  }
  return current;
}

function coerceScalar(schema: z.ZodType, value: string): unknown {
  const base = unwrap(schema);
  if (base instanceof z.ZodNumber) {
    const n = Number(value);
    return value.trim() !== '' && Number.isFinite(n) ? n : value;
  }
  if (base instanceof z.ZodBoolean) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }
  return value;
}

export function parseQuery(schema: z.ZodType, raw: RawQuery): Record<string, unknown> {
  const shape = unwrap(schema) instanceof z.ZodObject ? (unwrap(schema) as z.ZodObject).shape : {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    const field = (shape as Record<string, z.ZodType | undefined>)[key];
    if (!field) {
      out[key] = value;
      continue;
    }
    const base = unwrap(field);
    if (base instanceof z.ZodArray) {
      // « categories=sport » donne une chaîne : un tableau d'un seul élément est attendu.
      const items = Array.isArray(value) ? value : [value];
      out[key] = items.map((item) => coerceScalar(base.element as z.ZodType, item));
      continue;
    }
    // Paramètre simple répété par erreur : on garde la dernière valeur.
    const single = Array.isArray(value) ? value[value.length - 1] : value;
    out[key] = single === undefined ? undefined : coerceScalar(field, single);
  }
  return out;
}
