import { SealCheck } from 'phosphor-react-native/src/icons/SealCheck';
import { Star } from 'phosphor-react-native/src/icons/Star';
import type { Activity } from '@lokky/shared';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Avatar, Badge, Card, Text } from '@/ui';
import { formatRate, isTrustedCreator } from '@/lib';

// Réduire la gêne de venir seul (spec §2) : qui organise, et peut-on lui faire confiance ?
// Touchée, la carte ouvre le profil du créateur (sauf le sien).
export function CreatorTrustCard({
  creator,
  viewerId,
}: {
  creator: Activity['creator'];
  viewerId?: string;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { trust } = creator;
  const rating =
    trust.creatorRating === null
      ? t('activity.creatorNew')
      : t('activity.creatorRating', {
          rating: trust.creatorRating.toFixed(1).replace('.', ','),
          count: trust.creatorReviewCount,
        });
  const stats =
    trust.attendanceRate === null
      ? t('activity.creatorStatsNoRate', { created: trust.activitiesCreated })
      : t('activity.creatorStats', {
          created: trust.activitiesCreated,
          rate: formatRate(trust.attendanceRate),
        });

  return (
    <Card
      style={styles.card}
      accessibilityLabel={`${t('activity.creator')} ${creator.firstName}. ${rating}. ${stats}`}
      onPress={
        creator.id === viewerId
          ? undefined
          : () => router.push({ pathname: '/user/[id]', params: { id: creator.id } })
      }
    >
      <Avatar name={creator.firstName} uri={creator.avatarUrl} size="lg" />
      <View style={styles.copy}>
        <Text variant="caption" color="textMuted">
          {t('activity.creator')}
        </Text>
        <Text variant="bodyStrong">{creator.firstName}</Text>
        <View style={styles.rating}>
          {trust.creatorRating === null ? null : (
            <Star size={14} color={colors.warning} weight="fill" />
          )}
          <Text variant="caption">{rating}</Text>
        </View>
        <Text variant="caption" color="textMuted">
          {stats}
        </Text>
        {isTrustedCreator(trust) ? (
          <View style={styles.badge}>
            <Badge label={t('activity.trusted')} tone="trust" icon={SealCheck} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { flexDirection: 'row', gap: t.spacing.lg, alignItems: 'center' },
  copy: { flex: 1, gap: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  badge: { flexDirection: 'row', marginTop: t.spacing.xs },
}));
