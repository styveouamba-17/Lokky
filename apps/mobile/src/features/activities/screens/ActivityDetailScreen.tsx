import { MapTrifold } from 'phosphor-react-native/src/icons/MapTrifold';
import type { Activity } from '@lokky/shared';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { Flag } from 'phosphor-react-native/src/icons/Flag';
import { ShareNetwork } from 'phosphor-react-native/src/icons/ShareNetwork';
import { Platform, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { i18n, useTranslation } from '@/i18n';
import { activityUrl, formatActivityWhen } from '@/lib';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import { Badge, EmptyState, IconButton, IconDisc, Skeleton, Text } from '@/ui';
import { placeLabel } from '../components/ActivityCard';
import { ActivityCover, CategoryTag, hasActivityCover } from '../components/ActivityCover';
import { CostBadge } from '../components/CostBadge';
import { CreatorTrustCard } from '../components/CreatorTrustCard';
import { JoinBar } from '../components/JoinBar';
import { MeetupCard } from '../components/MeetupCard';
import { Participants } from '../components/Participants';
import { useActivity, useParticipants } from '../hooks/useActivity';

// Place du bouton retour flottant quand il n'y a pas de couverture.
const BACK_SPACE = 56;

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
      <View style={[styles.screen, { paddingTop: insets.top + BACK_SPACE }]}>
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
  // Sans illustration de catégorie, pas de bandeau : le contenu commence sous le bouton retour.
  const withCover = hasActivityCover(a);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          withCover ? null : { paddingTop: insets.top + BACK_SPACE },
        ]}
      >
        {withCover ? <ActivityCover activity={a} height={240 + insets.top} /> : null}
        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <View style={styles.tags}>
              <CategoryTag category={a.category} />
              {statusKey ? <Badge label={t(statusKey)} tone="neutral" /> : null}
            </View>
            <Text variant="title" accessibilityRole="header">
              {a.title}
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

          <CreatorTrustCard creator={a.creator} viewerId={me?.id} />
        </View>
      </ScrollView>
      {back}
      <View style={[styles.topActions, { top: insets.top + 8 }]}>
        <IconButton
          variant="filled"
          accessibilityLabel={t('activity.share')}
          onPress={() => void shareActivity(a)}
          icon={<ShareNetwork size={20} color={colors.text} weight="bold" />}
        />
        {a.viewerState.isCreator ? null : (
          <IconButton
            variant="filled"
            accessibilityLabel={t('activity.report')}
            onPress={() =>
              router.push({
                pathname: '/report',
                params: { targetType: 'activity', targetId: a.id },
              })
            }
            icon={<Flag size={20} color={colors.text} weight="bold" />}
          />
        )}
      </View>
      {me ? <JoinBar activity={a} me={me} /> : null}
    </View>
  );
}

// Partage par la feuille du téléphone (WhatsApp…) : titre, quand, et le lien de la sortie.
function shareActivity(a: Activity) {
  const url = activityUrl(a.id);
  const text = i18n.t('activity.shareMessage', {
    title: a.title,
    when: formatActivityWhen(a.startsAt, new Date()),
  });
  // iOS joint l'URL à part (aperçu du lien) ; Android n'a que le message.
  const content = Platform.OS === 'ios' ? { message: text, url } : { message: `${text} ${url}` };
  return Share.share(content).catch(() => undefined);
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
  topActions: {
    position: 'absolute',
    right: t.spacing.lg,
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  content: { padding: t.spacing.screen, gap: t.spacing.xl },
  titleBlock: { gap: t.spacing.sm, alignItems: 'flex-start' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
  info: { gap: 2 },
  costRow: { gap: t.spacing.xs, alignItems: 'flex-start' },
  section: { gap: t.spacing.sm },
}));
