import { formatCost, formatDistance, formatFcfa } from '../format';

const NBSP = '\u00A0';

describe('formatFcfa', () => {
  it('groupe les milliers avec des espaces insécables', () => {
    expect(formatFcfa(3000)).toBe(`3${NBSP}000${NBSP}FCFA`);
    expect(formatFcfa(1250000)).toBe(`1${NBSP}250${NBSP}000${NBSP}FCFA`);
    expect(formatFcfa(500)).toBe(`500${NBSP}FCFA`);
  });
  it('arrondit à l’unité', () => {
    expect(formatFcfa(2999.6)).toBe(`3${NBSP}000${NBSP}FCFA`);
  });
});

describe('formatCost', () => {
  it('affiche « Gratuit »', () => {
    expect(formatCost({ type: 'free' })).toBe('Gratuit');
  });
  it('affiche « Chacun paie sa part » avec ou sans estimation', () => {
    expect(formatCost({ type: 'split' })).toBe('Chacun paie sa part');
    expect(formatCost({ type: 'split', estimateFcfa: 3000 })).toBe(
      `Chacun paie sa part (~3${NBSP}000${NBSP}FCFA)`,
    );
  });
});

describe('formatDistance', () => {
  it('en mètres sous 1 km, arrondi à 100 m, minimum 100 m', () => {
    expect(formatDistance(0.34)).toBe('300 m');
    expect(formatDistance(0.04)).toBe('100 m');
  });
  it('avec une décimale entre 1 et 10 km', () => {
    expect(formatDistance(2.44)).toBe('2,4 km');
  });
  it('sans décimale à partir de 10 km', () => {
    expect(formatDistance(12.6)).toBe('13 km');
  });
});
