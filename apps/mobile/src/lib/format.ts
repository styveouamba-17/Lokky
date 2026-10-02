import type { ActivityCost } from '@lokky/shared';

const NBSP = '\u00A0';

export function formatFcfa(amount: number): string {
  const grouped = String(Math.round(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${amount < 0 ? '-' : ''}${grouped}${NBSP}FCFA`;
}

export function formatCost(cost: ActivityCost): string {
  if (cost.type === 'free') return 'Gratuit';
  return cost.estimateFcfa === undefined
    ? 'Chacun paie sa part'
    : `Chacun paie sa part (~${formatFcfa(cost.estimateFcfa)})`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m`;
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}
