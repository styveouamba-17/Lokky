import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { WifiSlash } from 'phosphor-react-native/src/icons/WifiSlash';
import { HandWaving } from 'phosphor-react-native/src/icons/HandWaving';
import type { Activity } from '@lokky/shared';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import { EmptyState, IconDisc, LokkyLogo, Skeleton, Text } from '@/ui';
import { ActivityCard } from '../components/ActivityCard';
import { DEFAULT_FILTERS, FilterBar, type FeedFilters } from '../components/FilterBar';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { useViewerOrigin } from '../hooks/useViewerOrigin';

export function DiscoverScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const firstName = useSessionStore((s) => s.me?.firstName ?? '');
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_FILTERS);
  const { origin, ready } = useViewerOrigin();
  const feed = useActivityFeed(
    {
      when: filters.when,
      freeOnly: filters.freeOnly || undefined,
      categories: filters.categories.length ? filters.categories : undefined,
      ...(origin ? { lat: origin.lat, lng: origin.lng } : {}),
    },
    { enabled: ready }, // attendre la position évite un double chargement
  );
  const now = new Date();
  const loading = !ready || feed.isPending;

  const header = (
    <View style={styles.header}>
      <View style={styles.greeting}>
        <View style={styles.greetingText}>
          <View style={styles.hello}>
            <Text variant="body" color="textMuted">
              {t('discover.greeting', { name: firstName })}
            </Text>
            <HandWaving size={18} color={colors.brand} weight="fill" />
          </View>
          <Text variant="title" accessibilityRole="header">
            {t('discover.title')}
          </Text>
        </View>
        <LokkyLogo variant="symbol" size={40} />
      </View>
      <FilterBar filters={filters} onChange={setFilters} />
    </View>
  );

  const empty = loading ? (
    <View style={styles.skeletons}>
      {[0, 1].map((i) => (
        <Skeleton key={i} height={260} radius={20} />
      ))}
    </View>
  ) : feed.isError ? (
    <EmptyState
      artwork="empty-offline"
      illustration={<IconDisc icon={WifiSlash} />}
      title={t('discover.error.title')}
      description={t('discover.error.body')}
      action={{ label: t('common.retry'), onPress: () => void feed.refetch() }}
    />
  ) : (
    <EmptyState
      artwork="empty-no-activity"
      illustration={<IconDisc icon={MagnifyingGlass} />}
      title={t('discover.empty.title')}
      description={t('discover.empty.body')}
      action={{ label: t('discover.empty.action'), onPress: () => router.push('/create') }}
    />
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlashList<Activity>
        data={loading ? [] : feed.activities}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ActivityCard activity={item} now={now} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshing={feed.isRefetching && !feed.isFetchingNextPage}
        onRefresh={() => void feed.refetch()}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  header: { gap: t.spacing.lg, paddingTop: t.spacing.md, paddingBottom: t.spacing.lg },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.screen,
  },
  greetingText: { flex: 1, gap: t.spacing.xs },
  hello: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  list: { paddingBottom: t.spacing.xxxl },
  item: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.lg },
  skeletons: { gap: t.spacing.lg, paddingHorizontal: t.spacing.screen },
}));
