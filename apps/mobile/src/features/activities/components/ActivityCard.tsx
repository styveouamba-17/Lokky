import { CheckCircle } from 'phosphor-react-native/src/icons/CheckCircle';
import { SealCheck } from 'phosphor-react-native/src/icons/SealCheck';
import { SunHorizon } from 'phosphor-react-native/src/icons/SunHorizon';
import { NEIGHBORHOODS, type Activity } from '@lokky/shared';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { formatActivityWhen, formatDistance, isTonight, isTrustedCreator } from '@/lib';
import { makeStyles } from '@/theme';
import { AvatarStack, Badge, Card, Text } from '@/ui';
import { ActivityCover, CategoryTag } from './ActivityCover';
import { CostBadge } from './CostBadge';

const COVER_HEIGHT = 128;

export function placeLabel(activity: Activity) {
  const { neighborhood, name } = activity.location;
  const place = neighborhood ? NEIGHBORHOODS[neighborhood].name : name;
  return activity.distanceKm === null ? place : `${place} · ${formatDistance(activity.distanceKm)}`;
}

// Carte du fil Découvrir (spec §6.2) : couverture peinte (si la catégorie en a une), catégorie,
// titre, quand, où, coût, qui vient.
// preview : aperçu non cliquable (récapitulatif de création).
export function ActivityCard({
  activity,
  now,
  preview = false,
}: {
  activity: Activity;
  now: Date;
  preview?: boolean;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const when = formatActivityWhen(activity.startsAt, now);
  const full = activity.participantCount >= activity.capacity;
  const spots = full
    ? t('activity.full')
    : t('activity.spots', { count: activity.participantCount, capacity: activity.capacity });

  return (
    <Card
      style={styles.card}
      accessibilityLabel={`${activity.title}. ${when}. ${placeLabel(activity)}. ${spots}.`}
      onPress={
        preview
          ? undefined
          : () => router.push({ pathname: '/activity/[id]', params: { id: activity.id } })
      }
    >
      <ActivityCover activity={activity} height={COVER_HEIGHT} />
      <View style={styles.body}>
        <View style={styles.tags}>
          <CategoryTag category={activity.category} />
          {isTonight(activity.startsAt, now) ? (
            <Badge label={t('discover.filters.tonight')} tone="accent" icon={SunHorizon} />
          ) : null}
          {activity.viewerState.isParticipant ? (
            <Badge label={t('activity.going')} tone="trust" icon={CheckCircle} />
          ) : null}
        </View>
        <Text variant="heading" numberOfLines={2}>
          {activity.title}
        </Text>
        <Text variant="bodyStrong" color="action">
          {when}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {placeLabel(activity)}
        </Text>
        <View style={styles.row}>
          <CostBadge cost={activity.cost} />
          {isTrustedCreator(activity.creator.trust) ? (
            <Badge label={t('activity.trusted')} tone="trust" icon={SealCheck} />
          ) : null}
        </View>
        <View style={styles.row}>
          <AvatarStack
            people={activity.participantsPreview.map((p) => ({
              id: p.id,
              name: p.firstName,
              uri: p.avatarUrl,
            }))}
            total={activity.participantCount}
            size="sm"
          />
          <Text variant="caption" color={full ? 'danger' : 'text'}>
            {spots}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { padding: 0, overflow: 'hidden' },
  body: { padding: t.spacing.lg, gap: t.spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs, marginBottom: t.spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: t.spacing.sm,
    marginTop: t.spacing.xs,
  },
}));
