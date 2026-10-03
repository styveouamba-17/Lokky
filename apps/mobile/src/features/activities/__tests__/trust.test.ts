import { isInDakar } from '../hooks/useViewerOrigin';
import { isTrustedCreator } from '../trust';

const trust = (creatorRating: number | null, creatorReviewCount: number) => ({
  activitiesAttended: 5,
  attendanceRate: 0.9,
  activitiesCreated: 4,
  creatorRating,
  creatorReviewCount,
});

describe('créateur fiable', () => {
  it('bien noté sur au moins 3 avis', () => {
    expect(isTrustedCreator(trust(4.8, 5))).toBe(true);
  });
  it('pas sur un seul avis, ni sous 4,5', () => {
    expect(isTrustedCreator(trust(5, 1))).toBe(false);
    expect(isTrustedCreator(trust(4.2, 10))).toBe(false);
    expect(isTrustedCreator(trust(null, 0))).toBe(false);
  });
});

describe('position à Dakar', () => {
  it('Ngor et le Plateau sont à Dakar, Paris non', () => {
    expect(isInDakar({ lat: 14.747, lng: -17.513 })).toBe(true);
    expect(isInDakar({ lat: 14.668, lng: -17.433 })).toBe(true);
    expect(isInDakar({ lat: 48.8566, lng: 2.3522 })).toBe(false);
  });
});
