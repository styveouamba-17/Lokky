import type { ActivityCost } from '@lokky/shared';
import { currentLanguage } from './locale';

const NBSP = ' ';

// « 3 000 FCFA » en français (espaces insécables), « 3,000 FCFA » en anglais.
export function formatFcfa(amount: number): string {
  const separator = currentLanguage() === 'en' ? ',' : NBSP;
  const grouped = String(Math.round(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return `${amount < 0 ? '-' : ''}${grouped}${NBSP}FCFA`;
}

export function formatCost(cost: ActivityCost): string {
  const en = currentLanguage() === 'en';
  if (cost.type === 'free') return en ? 'Free' : 'Gratuit';
  const split = en ? 'Everyone pays their share' : 'Chacun paie sa part';
  return cost.estimateFcfa === undefined ? split : `${split} (~${formatFcfa(cost.estimateFcfa)})`;
}

// « 1,2 km » en français, « 1.2 km » en anglais.
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m`;
  if (km < 10) {
    const value = (Math.round(km * 10) / 10).toFixed(1);
    return `${currentLanguage() === 'en' ? value : value.replace('.', ',')} km`;
  }
  return `${Math.round(km)} km`;
}
