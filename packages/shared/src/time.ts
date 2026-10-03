import {
  ACTIVITY_ONGOING_HOURS,
  CHAT_READONLY_AFTER_DAYS,
  LIMITS,
  type ActivityStatus,
} from './constants';

// Africa/Dakar est à UTC+0 toute l'année (pas d'heure d'été) :
// tous les calculs de « jour » utilisent les accesseurs UTC.
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export type When = 'tonight' | 'weekend' | 'all';

export function startOfDakarDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const endOfDay = (dayStart: Date) => new Date(dayStart.getTime() + DAY_MS - 1);

export function getWhenRange(when: When, now: Date): { from: Date; to: Date | null } {
  if (when === 'all') return { from: now, to: null };
  const today = startOfDakarDay(now);
  if (when === 'tonight') return { from: now, to: endOfDay(today) };

  const weekday = now.getUTCDay(); // 0 = dimanche, 6 = samedi
  if (weekday === 6) return { from: now, to: endOfDay(new Date(today.getTime() + DAY_MS)) };
  if (weekday === 0) return { from: now, to: endOfDay(today) };
  const saturday = new Date(today.getTime() + (6 - weekday) * DAY_MS);
  return { from: saturday, to: endOfDay(new Date(saturday.getTime() + DAY_MS)) };
}

export function getActivityStatus(
  startsAt: Date,
  cancelledAt: Date | null,
  now: Date,
): ActivityStatus {
  if (cancelledAt) return 'cancelled';
  const start = startsAt.getTime();
  const t = now.getTime();
  if (t < start) return 'upcoming';
  if (t < start + ACTIVITY_ONGOING_HOURS * HOUR_MS) return 'ongoing';
  return 'past';
}

// Le chat reste actif 7 jours après la fin de la sortie (ou son annulation), puis passe en
// lecture seule (spec §6.3, règle 2).
export function isChatReadOnly(startsAt: Date, cancelledAt: Date | null, now: Date): boolean {
  const end = cancelledAt
    ? cancelledAt.getTime()
    : startsAt.getTime() + ACTIVITY_ONGOING_HOURS * HOUR_MS;
  return now.getTime() >= end + CHAT_READONLY_AFTER_DAYS * DAY_MS;
}

export function ageInYears(birthDate: string, now: Date): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) throw new Error(`Date de naissance invalide : ${birthDate}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const nowMonth = now.getUTCMonth() + 1;
  const beforeBirthday = nowMonth < month || (nowMonth === month && now.getUTCDate() < day);
  return now.getUTCFullYear() - year - (beforeBirthday ? 1 : 0);
}

export function isAdult(birthDate: string, now: Date): boolean {
  return ageInYears(birthDate, now) >= LIMITS.user.minAge;
}
