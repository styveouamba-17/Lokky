import { MapTrifold } from 'phosphor-react-native/src/icons/MapTrifold';
import type { Activity } from '@lokky/shared';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { formatActivityWhen } from '@/lib';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import { Badge, EmptyState, IconButton, IconDisc, Skeleton, Text } from '@/ui';
import { placeLabel } from '../components/ActivityCard';
import { ActivityCover } from '../components/ActivityCover';
import { CostBadge } from '../components/CostBadge';
import { CreatorTrustCard } from '../components/CreatorTrustCard';
import { JoinBar } from '../components/JoinBar';
import { MeetupCard } from '../components/MeetupCard';
import { Participants } from '../components/Participants';
import { useActivity, useParticipants } from '../hooks/useActivity';

const STATUS_BADGE = {
  cancelled: 'activity.cancelled',
  ongoing: 'activity.ongoing',
  past: 'activity.past',
} as const;

export function ActivityDetailScreen({ id }: { id: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const me = useSessionStore((s) => s.me);
  const activity = useActivity(id);
  const participants = useParticipants(id);

  const back = (
    <View style={[styles.back, { top: insets.top + 8 }]}>
      <IconButton
        variant="filled"
        accessibilityLabel={t('common.back')}
        onPress={() => router.back()}
        icon={<ArrowLeft size={22} color={colors.text} weight="bold" />}
      />
    </View>
  );

  if (activity.isPending) {
    return (
      <View style={styles.screen}>
        <Skeleton height={240} radius={0} />
        <View style={styles.content}>
          <Skeleton height={32} width="70%" />
          <Skeleton height={120} />
        </View>
        {back}
      </View>
    );
  }
  if (activity.isError) {
    return (
      <View style={[styles.screen, styles.center]}>
        <EmptyState
          artwork="activity-gone"
          illustration={<IconDisc icon={MapTrifold} />}
          title={t('activity.notFound')}
          action={{ label: t('common.back'), onPress: () => router.back() }}
        />
      </View>
    );
  }

  const a: Activity = activity.data;
  const statusKey = a.status === 'upcoming' ? null : STATUS_BADGE[a.status];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ActivityCover category={a.category} height={240 + insets.top} />
        <View style={styles.content}>
          <View style={styles.titleBlock}>
            {statusKey ? <Badge label={t(statusKey)} tone="neutral" /> : null}
            <Text variant="title" accessibilityRole="header">
              {a.title}
            </Text>
            <Text variant="caption" color="textMuted">
              {t(`categories.${a.category}`)}
            </Text>
          </View>

          <Info label={t('activity.when')} value={formatActivityWhen(a.startsAt, new Date())} />
          <Info label={t('activity.where')} value={placeLabel(a)} />
          <View style={styles.costRow}>
            <Text variant="caption" color="textMuted">
              {t('activity.cost')}
            </Text>
            <CostBadge cost={a.cost} />
          </View>

          <MeetupCard location={a.location} />
          <Participants activity={a} participants={participants.data} viewerId={me?.id} />

          {a.description ? (
            <View style={styles.section}>
              <Text variant="heading" accessibilityRole="header">
                {t('activity.about')}
              </Text>
              <Text>{a.description}</Text>
            </View>
          ) : null}

          <CreatorTrustCard creator={a.creator} />
        </View>
      </ScrollView>
      {back}
      {me ? <JoinBar activity={a} me={me} /> : null}
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.info}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  center: { justifyContent: 'center' },
  scroll: { paddingBottom: t.spacing.xxxl },
  back: { position: 'absolute', left: t.spacing.lg },
  content: { padding: t.spacing.screen, gap: t.spacing.xl },
  titleBlock: { gap: t.spacing.xs, alignItems: 'flex-start' },
  info: { gap: 2 },
  costRow: { gap: t.spacing.xs, alignItems: 'flex-start' },
  section: { gap: t.spacing.sm },
}));
