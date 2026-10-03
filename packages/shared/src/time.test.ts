import { describe, expect, it } from 'vitest';
import {
  ageInYears,
  getActivityStatus,
  getWhenRange,
  isAdult,
  isChatReadOnly,
  startOfDakarDay,
} from './time';

// 2026-10-07 est un mercredi.
const WED_10H = new Date('2026-10-07T10:00:00Z');

describe('startOfDakarDay', () => {
  it('ramène au début du jour en heure de Dakar (UTC+0)', () => {
    expect(startOfDakarDay(new Date('2026-10-07T23:30:00Z')).toISOString()).toBe(
      '2026-10-07T00:00:00.000Z',
    );
  });
});

describe('getWhenRange', () => {
  it('« ce soir » va de maintenant à la fin de la journée', () => {
    const r = getWhenRange('tonight', WED_10H);
    expect(r.from).toEqual(WED_10H);
    expect(r.to?.toISOString()).toBe('2026-10-07T23:59:59.999Z');
  });

  it('« ce week-end » un mercredi couvre samedi et dimanche', () => {
    const r = getWhenRange('weekend', WED_10H);
    expect(r.from.toISOString()).toBe('2026-10-10T00:00:00.000Z');
    expect(r.to?.toISOString()).toBe('2026-10-11T23:59:59.999Z');
  });

  it('« ce week-end » un samedi part de maintenant jusqu’à dimanche soir', () => {
    const sat = new Date('2026-10-10T15:00:00Z');
    const r = getWhenRange('weekend', sat);
    expect(r.from).toEqual(sat);
    expect(r.to?.toISOString()).toBe('2026-10-11T23:59:59.999Z');
  });

  it('« ce week-end » un dimanche se limite à la fin du dimanche', () => {
    const sun = new Date('2026-10-11T20:00:00Z');
    expect(getWhenRange('weekend', sun).to?.toISOString()).toBe('2026-10-11T23:59:59.999Z');
  });

  it('« tout » n’a pas de fin', () => {
    expect(getWhenRange('all', WED_10H)).toEqual({ from: WED_10H, to: null });
  });
});

describe('getActivityStatus', () => {
  const start = new Date('2026-10-07T18:00:00Z');
  const at = (iso: string) => new Date(iso);

  it('est à venir avant le début', () => {
    expect(getActivityStatus(start, null, at('2026-10-07T17:59:59Z'))).toBe('upcoming');
  });
  it('est en cours dès l’heure de début et pendant 3 h', () => {
    expect(getActivityStatus(start, null, start)).toBe('ongoing');
    expect(getActivityStatus(start, null, at('2026-10-07T20:59:59.999Z'))).toBe('ongoing');
  });
  it('est passée 3 h après le début', () => {
    expect(getActivityStatus(start, null, at('2026-10-07T21:00:00Z'))).toBe('past');
  });
  it('l’annulation l’emporte sur tout', () => {
    expect(getActivityStatus(start, at('2026-10-06T10:00:00Z'), at('2026-10-07T19:00:00Z'))).toBe(
      'cancelled',
    );
  });
});

describe('âge', () => {
  it('compte 18 ans le jour exact du 18e anniversaire', () => {
    expect(ageInYears('2008-10-07', WED_10H)).toBe(18);
    expect(isAdult('2008-10-07', WED_10H)).toBe(true);
  });
  it('refuse la veille du 18e anniversaire', () => {
    expect(ageInYears('2008-10-08', WED_10H)).toBe(17);
    expect(isAdult('2008-10-08', WED_10H)).toBe(false);
  });
  it('rejette une date mal formée', () => {
    expect(() => ageInYears('07/10/2008', WED_10H)).toThrow();
  });
});

describe('isChatReadOnly', () => {
  const start = new Date('2026-10-01T18:00:00Z');
  it('reste ouvert pendant 7 jours après la fin de la sortie (début + 3 h)', () => {
    expect(isChatReadOnly(start, null, new Date('2026-10-08T20:59:00Z'))).toBe(false);
  });
  it('passe en lecture seule ensuite', () => {
    expect(isChatReadOnly(start, null, new Date('2026-10-08T21:00:00Z'))).toBe(true);
  });
  it('une sortie annulée garde son chat 7 jours après l’annulation', () => {
    const cancelled = new Date('2026-09-20T10:00:00Z');
    expect(isChatReadOnly(start, cancelled, new Date('2026-09-26T10:00:00Z'))).toBe(false);
    expect(isChatReadOnly(start, cancelled, new Date('2026-09-27T10:00:00Z'))).toBe(true);
  });
});
