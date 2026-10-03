import { stableIndex } from '../variant';

describe('stableIndex', () => {
  it('donne toujours la même variante pour une même clé', () => {
    expect(stableIndex('a_foot', 3)).toBe(stableIndex('a_foot', 3));
  });
  it('reste dans les bornes et répartit les clés', () => {
    const picks = ['a_foot', 'a_cine', 'a_bu', 'a_jeux', 'a_kermel', 'a_ngor'].map((k) =>
      stableIndex(k, 3),
    );
    expect(picks.every((i) => i >= 0 && i < 3)).toBe(true);
    expect(new Set(picks).size).toBeGreaterThan(1);
  });
  it('aucune variante : -1', () => {
    expect(stableIndex('a_foot', 0)).toBe(-1);
  });
});
