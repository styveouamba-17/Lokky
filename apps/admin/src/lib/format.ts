// Dates de l'admin, à l'heure de Dakar (UTC, sans heure d'été).
const TIME_ZONE = 'Africa/Dakar';

const dateTime = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const dateOnly = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dayMonth = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
});
const timeOnly = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));
export const formatDayMonth = (iso: string) => dayMonth.format(new Date(iso));
export const formatTime = (iso: string) => timeOnly.format(new Date(iso));

const relative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60],
  ['hour', 24],
  ['day', 30],
  ['month', 12],
  ['year', Infinity],
];

// « il y a 3 heures », « dans 2 jours ».
export function formatRelative(iso: string, now: Date = new Date()): string {
  let value = (new Date(iso).getTime() - now.getTime()) / 60_000;
  if (Math.abs(value) < 1) return 'à l’instant';
  for (const [unit, size] of STEPS) {
    if (Math.abs(value) < size) return relative.format(Math.round(value), unit);
    value /= size;
  }
  return formatDate(iso);
}

export function ageFrom(birthDate: string, now: Date = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number) as [number, number, number];
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d)) age -= 1;
  return age;
}

export const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
export const plural = (n: number, one: string, many: string) =>
  `${formatNumber(n)} ${n > 1 ? many : one}`;
