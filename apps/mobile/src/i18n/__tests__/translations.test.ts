import en from '../en.json';
import fr from '../fr.json';

type Tree = { [key: string]: string | Tree };

// Toutes les clés « a.b.c », avec le texte.
function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

const variables = (text: string) => [...text.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort();

describe('traductions', () => {
  const frKeys = flatten(fr as Tree);
  const enKeys = flatten(en as Tree);

  it('l’anglais a exactement les mêmes clés que le français', () => {
    expect([...enKeys.keys()].sort()).toEqual([...frKeys.keys()].sort());
  });

  it('les mêmes variables {{…}} dans chaque texte', () => {
    for (const [key, text] of frKeys) {
      expect([key, variables(enKeys.get(key) ?? '')]).toEqual([key, variables(text)]);
    }
  });

  it('aucun texte vide', () => {
    for (const [key, text] of [...frKeys, ...enKeys])
      expect([key, text.trim()]).not.toEqual([key, '']);
  });
});
