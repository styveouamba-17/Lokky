import { NEIGHBORHOODS } from '@lokky/shared';
import { nextSaturday, timeSlots, toCreateInput } from '../draft';

// Mercredi 7 octobre 2026, 18h10 à Dakar.
const NOW = new Date('2026-10-07T18:10:00Z');

const DRAFT = {
  category: 'beach' as const,
  title: 'Baignade à Ngor',
  description: '',
  day: '2026-10-10',
  time: '11:00',
  placeId: 'plage-ngor',
  placeName: 'Plage de Ngor',
  neighborhood: 'fann' as const,
  meetingPoint: '',
  capacity: 8,
  costType: 'free' as const,
  estimate: '',
};

describe('brouillon de création', () => {
  it('aujourd’hui : seulement les créneaux dans 15 min ou plus', () => {
    const slots = timeSlots('2026-10-07', NOW);
    expect(slots[0]).toBe('18:30');
    expect(slots).not.toContain('18:00');
    expect(slots.at(-1)).toBe('23:30');
  });

  it('un autre jour : tous les créneaux de 7h à 23h30', () => {
    expect(timeSlots('2026-10-08', NOW)).toHaveLength(34);
  });

  it('« Samedi » : le samedi qui vient', () => {
    expect(nextSaturday(NOW).toISOString()).toBe('2026-10-10T00:00:00.000Z');
  });

  it('lieu populaire : ses coordonnées et son quartier, heure de Dakar', () => {
    const input = toCreateInput(DRAFT);
    expect(input.startsAt).toBe('2026-10-10T11:00:00.000Z');
    expect(input.location).toMatchObject({
      name: 'Plage de Ngor',
      neighborhood: 'ngor',
      meetingPoint: null,
    });
    expect(input.cost).toEqual({ type: 'free' });
  });

  it('lieu libre : coordonnées du quartier ; coût partagé avec estimation', () => {
    const input = toCreateInput({
      ...DRAFT,
      placeId: null,
      placeName: 'Chez Fatou',
      neighborhood: 'mermoz',
      costType: 'split',
      estimate: '3000',
    });
    expect(input.location.coordinates).toEqual(NEIGHBORHOODS.mermoz.coordinates);
    expect(input.cost).toEqual({ type: 'split', estimateFcfa: 3000 });
  });
});
