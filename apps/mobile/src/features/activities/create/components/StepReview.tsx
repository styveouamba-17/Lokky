import type { Activity } from '@lokky/shared';
import { Pressable, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { formatActivityWhen, formatCost } from '@/lib';
import { makeStyles } from '@/theme';
import { StepIntro, Text } from '@/ui';
import { ActivityCard, placeLabel } from '../../components/ActivityCard';

// Récapitulatif : la carte telle qu'elle apparaîtra, puis chaque champ avec « Modifier ».
export function StepReview({
  activity,
  now,
  onEdit,
}: {
  activity: Activity;
  now: Date;
  onEdit: (step: number) => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const rows = [
    { label: t('create.review.when'), value: formatActivityWhen(activity.startsAt, now), step: 1 },
    { label: t('create.review.where'), value: placeLabel(activity), step: 2 },
    ...(activity.location.meetingPoint
      ? [{ label: t('create.review.meetingPoint'), value: activity.location.meetingPoint, step: 2 }]
      : []),
    {
      label: t('create.review.count'),
      value: t('create.count.people', { count: activity.capacity }),
      step: 3,
    },
    { label: t('create.review.cost'), value: formatCost(activity.cost), step: 4 },
  ];

  return (
    <View style={styles.stack}>
      <StepIntro title={t('create.review.title')} body={t('create.review.body')} />
      <ActivityCard activity={activity} now={now} preview />
      <View style={styles.rows}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <View style={styles.rowText}>
              <Text variant="caption" color="textMuted">
                {row.label}
              </Text>
              <Text variant="bodyStrong">{row.value}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('create.edit')} : ${row.label}`}
              hitSlop={12}
              onPress={() => onEdit(row.step)}
            >
              <Text variant="label" color="action">
                {t('create.edit')}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      {activity.description ? <Text color="textMuted">{activity.description}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.xl },
  rows: {
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: 56,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  rowText: { flex: 1, gap: 2 },
}));
