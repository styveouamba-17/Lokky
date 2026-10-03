// Choix stable parmi `count` variantes : une même clé donne toujours le même résultat,
// des clés différentes se répartissent entre les variantes.
export function stableIndex(key: string, count: number): number {
  if (count <= 0) return -1;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % count;
}
