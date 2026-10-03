import { NEIGHBORHOODS, type Activity, type User } from '@lokky/shared';
import { router } from 'expo-router';
import { SealCheck } from 'phosphor-react-native/src/icons/SealCheck';
import { Star } from 'phosphor-react-native/src/icons/Star';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { formatActivityWhen, formatRate, isTrustedCreator } from '@/lib';
import { makeStyles, useTheme } from '@/theme';
import { Avatar, Badge, Card, CATEGORY_ICONS, Skeleton, Text } from '@/ui';

// Blocs communs au profil public et à « Mon profil » (spec §6.2). Pas de compteur d'abonnés,
// pas de badge « vérifié » en v1.

export function ProfileHeader({ user }: { user: User }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.identity}>
      <Avatar name={user.firstName} uri={user.avatarUrl} size="xl" />
      <Text variant="title" accessibilityRole="header">
        {user.firstName}
      </Text>
      <Text color="textMuted">
        {t(`statuses.${user.status}`)} · {NEIGHBORHOODS[user.neighborhood].name}
      </Text>
      {isTrustedCreator(user.trust) ? (
        <Badge label={t('activity.trusted')} tone="trust" icon={SealCheck} />
      ) : null}
    </View>
  );
}

// Statistiques de confiance : sorties faites, présence, sorties organisées, puis la note.
export function TrustStats({ trust }: { trust: User['trust'] }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stats = [
    { label: t('profile.attended'), value: String(trust.activitiesAttended) },
    {
      label: t('profile.attendance'),
      value:
        trust.attendanceRate === null ? t('profile.newMember') : formatRate(trust.attendanceRate),
    },
    { label: t('profile.created'), value: String(trust.activitiesCreated) },
  ];
  return (
    <Card style={styles.statsCard}>
      <View style={styles.stats}>
        {stats.map((s) => (
          <View
            key={s.label}
            style={styles.stat}
            accessible
            accessibilityLabel={`${s.label} : ${s.value}`}
          >
            <Text variant="heading">{s.value}</Text>
            <Text variant="caption" color="textMuted">
              {s.label}
            </Text>
          </View>
        ))}
      </View>
      {trust.creatorRating !== null ? (
        <View
          style={styles.rating}
          accessible
          accessibilityLabel={`${t('profile.rating')} : ${t('profile.ratingValue', {
            rating: trust.creatorRating.toFixed(1).replace('.', ','),
            count: trust.creatorReviewCount,
          })}`}
        >
          <Star size={16} color={colors.warning} weight="fill" />
          <Text variant="label">
            {t('profile.ratingValue', {
              rating: trust.creatorRating.toFixed(1).replace('.', ','),
              count: trust.creatorReviewCount,
            })}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export function Interests({ interests }: { interests: User['interests'] }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text variant="heading" accessibilityRole="header">
        {t('profile.interests')}
      </Text>
      <View style={styles.badges}>
        {interests.map((c) => (
          <Badge key={c} label={t(`categories.${c}`)} icon={CATEGORY_ICONS[c]} tone="neutral" />
        ))}
      </View>
    </View>
  );
}

export function OrganizedActivities({
  title,
  activities,
  loading,
}: {
  title: string;
  activities: Activity[] | undefined;
  loading: boolean;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const now = new Date();
  return (
    <View style={styles.section}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {loading ? (
        <Skeleton height={64} />
      ) : !activities?.length ? (
        <Text color="textMuted">{t('profile.noUpcoming')}</Text>
      ) : (
        activities.map((a) => {
          const Icon = CATEGORY_ICONS[a.category];
          const when = formatActivityWhen(a.startsAt, now);
          return (
            <Card
              key={a.id}
              style={styles.activity}
              accessibilityLabel={`${a.title}. ${when}. ${a.location.name}.`}
              onPress={() => router.push({ pathname: '/activity/[id]', params: { id: a.id } })}
            >
              <View style={styles.activityIcon}>
                <Icon size={22} color={colors.action} weight="duotone" />
              </View>
              <View style={styles.activityText}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {a.title}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {when} · {a.location.name}
                </Text>
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  identity: { alignItems: 'center', gap: t.spacing.sm, paddingTop: t.spacing.lg },
  statsCard: { gap: t.spacing.md },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2, flex: 1 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.xs,
    paddingTop: t.spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  section: { gap: t.spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  activity: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: { flex: 1, gap: 2 },
}));
