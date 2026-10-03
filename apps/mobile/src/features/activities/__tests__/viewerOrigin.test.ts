import { isInDakar } from '../hooks/useViewerOrigin';

describe('position à Dakar', () => {
  it('Ngor et le Plateau sont à Dakar, Paris non', () => {
    expect(isInDakar({ lat: 14.747, lng: -17.513 })).toBe(true);
    expect(isInDakar({ lat: 14.668, lng: -17.433 })).toBe(true);
    expect(isInDakar({ lat: 48.8566, lng: 2.3522 })).toBe(false);
  });
});
