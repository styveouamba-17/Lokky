import type { ActivityCost } from '@lokky/shared';
import { useTranslation } from '@/i18n';
import { formatFcfa } from '@/lib';
import { Badge } from '@/ui';

// Le coût est visible tout de suite (spec §2, principe 3).
export function CostBadge({ cost }: { cost: ActivityCost }) {
  const { t } = useTranslation();
  if (cost.type === 'free') return <Badge label={t('activity.free')} tone="free" />;
  return (
    <Badge
      tone="split"
      label={
        cost.estimateFcfa === undefined
          ? t('activity.split')
          : t('activity.splitEstimate', { amount: formatFcfa(cost.estimateFcfa) })
      }
    />
  );
}
