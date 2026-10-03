import { startOfDakarDay } from '@lokky/shared';
import { currentLanguage, type Language } from './locale';

// Heure de Dakar = UTC+0 : uniquement des accesseurs UTC, jamais l'heure locale du téléphone.
// Les mots suivent la langue de l'app (Réglages › Apparence et langue).
const DAY_MS = 86_400_000;
const EVENING_HOUR = 17;

interface DateWords {
  weekdays: readonly string[];
  shortWeekday: (day: number) => string;
  months: readonly string[];
  today: string;
  tonight: string;
  tomorrow: string;
  yesterday: string;
  at: string;
  hour: (date: Date) => string;
  shortDate: (day: number, month: string) => string;
  withYear: (base: string, year: number) => string;
}

const WORDS: Record<Language, DateWords> = {
  fr: {
    weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    shortWeekday(day) {
      return `${this.weekdays[day]!.slice(0, 3)}.`;
    },
    months: [
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
    ],
    today: 'Aujourd’hui',
    tonight: 'Ce soir',
    tomorrow: 'Demain',
    yesterday: 'Hier',
    at: 'à',
    // « 19h », « 19h30 »
    hour: (date) => {
      const minutes = date.getUTCMinutes();
      return `${date.getUTCHours()}h${minutes === 0 ? '' : String(minutes).padStart(2, '0')}`;
    },
    shortDate: (day, month) => `${day} ${month}`,
    withYear: (base, year) => `${base} ${year}`,
  },
  en: {
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortWeekday(day) {
      return this.weekdays[day]!.slice(0, 3);
    },
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    today: 'Today',
    tonight: 'Tonight',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    at: 'at',
    // « 7 pm », « 7:30 pm »
    hour: (date) => {
      const h = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}${minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`} ${h < 12 ? 'am' : 'pm'}`;
    },
    shortDate: (day, month) => `${month} ${day}`,
    withYear: (base, year) => `${base}, ${year}`,
  },
};

const words = () => WORDS[currentLanguage()];

export function formatHour(date: Date): string {
  return words().hour(date);
}

function formatShortDate(date: Date, now: Date): string {
  const w = words();
  const base = w.shortDate(date.getUTCDate(), w.months[date.getUTCMonth()]!);
  return date.getUTCFullYear() === now.getUTCFullYear()
    ? base
    : w.withYear(base, date.getUTCFullYear());
}

const dayDiffFrom = (date: Date, now: Date) =>
  Math.round((startOfDakarDay(date).getTime() - startOfDakarDay(now).getTime()) / DAY_MS);

const toDate = (value: string | Date) => (typeof value === 'string' ? new Date(value) : value);

// Ce soir : aujourd'hui, à partir de 17h (badge « Ce soir » des cartes).
export function isTonight(startsAt: string | Date, now: Date): boolean {
  const date = toDate(startsAt);
  return dayDiffFrom(date, now) === 0 && date.getUTCHours() >= EVENING_HOUR;
}

export function formatActivityWhen(startsAt: string | Date, now: Date): string {
  const w = words();
  const date = toDate(startsAt);
  const dayDiff = dayDiffFrom(date, now);
  const hour = w.hour(date);

  if (dayDiff === 0) return `${isTonight(date, now) ? w.tonight : w.today} · ${hour}`;
  if (dayDiff === 1) return `${w.tomorrow} · ${hour}`;
  if (dayDiff === -1) return `${w.yesterday} · ${hour}`;
  if (dayDiff > 1 && dayDiff <= 6) return `${w.weekdays[date.getUTCDay()]} · ${hour}`;
  return `${formatShortDate(date, now)} · ${hour}`;
}

// « 12 oct. à 18h » / « Oct 12 at 6 pm » (année ajoutée si ce n'est pas l'année en cours).
export function formatDayAndHour(date: string | Date, now: Date): string {
  const d = toDate(date);
  return `${formatShortDate(d, now)} ${words().at} ${formatHour(d)}`;
}

// Puce de jour à la création : « Ven. 9 » / « Fri 9 ». Les raccourcis « Ce soir », « Demain »,
// « Samedi » sont à part : la date évite les doublons dans la liste des jours.
export function formatDayChip(day: Date): string {
  return `${words().shortWeekday(day.getUTCDay())} ${day.getUTCDate()}`;
}

// Séparateur de jour dans le chat : « Aujourd’hui », « Hier », « Lundi », « 12 oct. ».
export function formatDayLabel(date: string | Date, now: Date): string {
  const w = words();
  const d = toDate(date);
  const diff = dayDiffFrom(d, now);
  if (diff === 0) return w.today;
  if (diff === -1) return w.yesterday;
  if (diff < -1 && diff >= -6) return w.weekdays[d.getUTCDay()]!;
  return formatShortDate(d, now);
}

// Heure du dernier message dans la liste : « 14h05 », « Hier », « Lun. », « 12 oct. ».
export function formatMessageTime(date: string | Date, now: Date): string {
  const w = words();
  const d = toDate(date);
  const diff = dayDiffFrom(d, now);
  if (diff >= 0) return w.hour(d);
  if (diff === -1) return w.yesterday;
  if (diff >= -6) return w.shortWeekday(d.getUTCDay());
  return formatShortDate(d, now);
}
