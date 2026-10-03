import { startOfDakarDay } from '@lokky/shared';

// Heure de Dakar = UTC+0 : uniquement des accesseurs UTC, jamais l'heure locale du téléphone.
const DAY_MS = 86_400_000;
const EVENING_HOUR = 17;
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

export function formatHour(date: Date): string {
  const minutes = date.getUTCMinutes();
  return `${date.getUTCHours()}h${minutes === 0 ? '' : String(minutes).padStart(2, '0')}`;
}

function formatShortDate(date: Date, now: Date): string {
  const base = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  return date.getUTCFullYear() === now.getUTCFullYear() ? base : `${base} ${date.getUTCFullYear()}`;
}

export function formatActivityWhen(startsAt: string | Date, now: Date): string {
  const date = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  const dayDiff = Math.round(
    (startOfDakarDay(date).getTime() - startOfDakarDay(now).getTime()) / DAY_MS,
  );
  const hour = formatHour(date);

  if (dayDiff === 0) {
    return date.getUTCHours() >= EVENING_HOUR ? `Ce soir · ${hour}` : `Aujourd’hui · ${hour}`;
  }
  if (dayDiff === 1) return `Demain · ${hour}`;
  if (dayDiff === -1) return `Hier · ${hour}`;
  if (dayDiff > 1 && dayDiff <= 6) return `${WEEKDAYS[date.getUTCDay()]} · ${hour}`;
  return `${formatShortDate(date, now)} · ${hour}`;
}

// « 12 oct. à 18h » (année ajoutée si ce n'est pas l'année en cours).
export function formatDayAndHour(date: string | Date, now: Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatShortDate(d, now)} à ${formatHour(d)}`;
}

// Puce de jour à la création : « Ven. 9 ». Les raccourcis « Ce soir », « Demain », « Samedi »
// sont à part : la date évite les doublons dans la liste des jours.
export function formatDayChip(day: Date): string {
  return `${WEEKDAYS[day.getUTCDay()]!.slice(0, 3)}. ${day.getUTCDate()}`;
}
