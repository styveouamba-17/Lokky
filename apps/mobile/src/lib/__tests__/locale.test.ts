import { i18n } from '@/i18n';
import {
  formatActivityWhen,
  formatCost,
  formatDayAndHour,
  formatDayChip,
  formatDayLabel,
  formatDistance,
  formatFcfa,
  formatMessageTime,
  isTonight,
} from '..';

const NBSP = ' ';
// Mercredi 7 octobre 2026, 10h à Dakar.
const NOW = new Date('2026-10-07T10:00:00Z');

describe('formats en anglais', () => {
  beforeAll(() => i18n.changeLanguage('en'));
  afterAll(() => i18n.changeLanguage('fr'));

  it('dates relatives et heures sur 12 h', () => {
    expect(formatActivityWhen('2026-10-07T19:00:00Z', NOW)).toBe('Tonight · 7 pm');
    expect(formatActivityWhen('2026-10-07T12:30:00Z', NOW)).toBe('Today · 12:30 pm');
    expect(formatActivityWhen('2026-10-08T09:00:00Z', NOW)).toBe('Tomorrow · 9 am');
    expect(formatActivityWhen('2026-10-10T17:00:00Z', NOW)).toBe('Saturday · 5 pm');
    expect(formatActivityWhen('2026-11-20T00:00:00Z', NOW)).toBe('Nov 20 · 12 am');
    expect(formatActivityWhen('2027-01-05T18:00:00Z', NOW)).toBe('Jan 5, 2027 · 6 pm');
  });

  it('jour et heure, puces de jour, chat', () => {
    expect(formatDayAndHour('2026-10-12T18:00:00Z', NOW)).toBe('Oct 12 at 6 pm');
    expect(formatDayChip(new Date('2026-10-09T00:00:00Z'))).toBe('Fri 9');
    expect(formatDayLabel('2026-10-06T08:00:00Z', NOW)).toBe('Yesterday');
    expect(formatMessageTime('2026-10-03T09:05:00Z', NOW)).toBe('Sat');
  });

  it('montants et distances', () => {
    expect(formatFcfa(3000)).toBe(`3,000${NBSP}FCFA`);
    expect(formatCost({ type: 'free' })).toBe('Free');
    expect(formatCost({ type: 'split', estimateFcfa: 3000 })).toBe(
      `Everyone pays their share (~3,000${NBSP}FCFA)`,
    );
    expect(formatDistance(1.24)).toBe('1.2 km');
  });
});

describe('« Ce soir » ne dépend pas de la langue', () => {
  it('à partir de 17h le jour même', () => {
    expect(isTonight('2026-10-07T17:00:00Z', NOW)).toBe(true);
    expect(isTonight('2026-10-07T16:59:00Z', NOW)).toBe(false);
    expect(isTonight('2026-10-08T19:00:00Z', NOW)).toBe(false);
  });
});
