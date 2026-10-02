import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('vaut 0 pour un même point', () => {
    expect(haversineKm({ lat: 14.7, lng: -17.4 }, { lat: 14.7, lng: -17.4 })).toBe(0);
  });
  it('donne environ 10,6 km entre le Plateau et Yoff', () => {
    const d = haversineKm({ lat: 14.668, lng: -17.433 }, { lat: 14.756, lng: -17.471 });
    expect(d).toBeGreaterThan(10);
    expect(d).toBeLessThan(11.5);
  });
});
