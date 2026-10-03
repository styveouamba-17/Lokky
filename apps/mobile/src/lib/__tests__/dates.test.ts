import { formatActivityWhen, formatDayLabel, formatMessageTime } from '../dates';

// Mercredi 7 octobre 2026, 10h à Dakar. Jest tourne en UTC+14 (jest.global-setup.js).
const NOW = new Date('2026-10-07T10:00:00Z');
const when = (iso: string) => formatActivityWhen(iso, NOW);

describe('formatActivityWhen', () => {
  it('« Ce soir » à partir de 17h le jour même', () => {
    expect(when('2026-10-07T19:00:00Z')).toBe('Ce soir · 19h');
  });
  it('« Aujourd’hui » avant 17h, avec les minutes si besoin', () => {
    expect(when('2026-10-07T14:30:00Z')).toBe('Aujourd’hui · 14h30');
  });
  it('reste « Ce soir » à 23h à Dakar même si le téléphone est déjà au lendemain', () => {
    expect(when('2026-10-07T23:00:00Z')).toBe('Ce soir · 23h');
  });
  it('« Demain »', () => {
    expect(when('2026-10-08T18:00:00Z')).toBe('Demain · 18h');
  });
  it('le nom du jour dans la semaine qui vient', () => {
    expect(when('2026-10-10T17:00:00Z')).toBe('Samedi · 17h');
  });
  it('la date courte au-delà de 6 jours', () => {
    expect(when('2026-10-14T16:00:00Z')).toBe('14 oct. · 16h');
  });
  it('ajoute l’année si elle diffère', () => {
    expect(when('2027-01-03T10:05:00Z')).toBe('3 janv. 2027 · 10h05');
  });
  it('« Hier » pour la veille', () => {
    expect(when('2026-10-06T19:00:00Z')).toBe('Hier · 19h');
  });
});

describe('formatDayLabel', () => {
  const now = new Date('2026-10-07T10:00:00Z'); // mercredi
  it('aujourd’hui, hier, jour de la semaine, puis date', () => {
    expect(formatDayLabel('2026-10-07T08:00:00Z', now)).toBe('Aujourd’hui');
    expect(formatDayLabel('2026-10-06T23:00:00Z', now)).toBe('Hier');
    expect(formatDayLabel('2026-10-03T12:00:00Z', now)).toBe('Samedi');
    expect(formatDayLabel('2026-09-28T12:00:00Z', now)).toBe('28 sept.');
  });
});

describe('formatMessageTime', () => {
  const now = new Date('2026-10-07T10:00:00Z');
  it('heure du jour, hier, jour abrégé, puis date', () => {
    expect(formatMessageTime('2026-10-07T09:05:00Z', now)).toBe('9h05');
    expect(formatMessageTime('2026-10-06T09:05:00Z', now)).toBe('Hier');
    expect(formatMessageTime('2026-10-03T09:05:00Z', now)).toBe('Sam.');
    expect(formatMessageTime('2026-09-20T09:05:00Z', now)).toBe('20 sept.');
  });
});
