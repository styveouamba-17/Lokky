import type { Activity, MyActivitiesScope } from '@lokky/shared';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { Megaphone } from 'phosphor-react-native/src/icons/Megaphone';
import { ImageSquare } from 'phosphor-react-native/src/icons/ImageSquare';
import { WifiSlash } from 'phosphor-react-native/src/icons/WifiSlash';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import {
  EmptyState,
  IconDisc,
  Skeleton,
  Text,
  type IconComponent,
  type IllustrationName,
} from '@/ui';
import { ActivityCard } from '../components/ActivityCard';
import { AfterActivityActions } from '../components/AfterActivityActions';
import { useMyActivities } from '../hooks/useMyActivities';

const SCOPES: readonly MyActivitiesScope[] = ['upcoming', 'past', 'created'];

const EMPTY: Record<
  MyActivitiesScope,
  { artwork: IllustrationName; icon: IconComponent; onPress: () => void }
> = {
  upcoming: {
    artwork: 'empty-upcoming',
    icon: CalendarBlank,
    onPress: () => router.navigate('/discover'),
  },
  past: { artwork: 'empty-past', icon: ImageSquare, onPress: () => router.navigate('/discover') },
  created: { artwork: 'empty-created', icon: Megaphone, onPress: () => router.push('/create') },
};

// Mes activités (spec §6.2) : À venir · Passées (avec les avis à laisser) · Créées par moi.
export function MyActivitiesScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const [scope, setScope] = useState<MyActivitiesScope>('upcoming');
  const list = useMyActivities(scope);
  const now = new Date();
  const empty = EMPTY[scope];

  const header = (
    <View style={styles.header}>
      <Text variant="title" accessibilityRole="header">
        {t('mine.title')}
      </Text>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {SCOPES.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="tab"
            accessibilityState={{ selected: s === scope }}
            onPress={() => setScope(s)}
            style={[styles.tab, s === scope && styles.tabSelected]}
          >
            <Text variant="label" color={s === scope ? 'text' : 'textMuted'} numberOfLines={1}>
              {t(`mine.tabs.${s}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const emptyView = list.isPending ? (
    <View style={styles.skeletons}>
      <Skeleton height={220} radius={20} />
    </View>
  ) : list.isError ? (
    <EmptyState
      artwork="empty-offline"
      illustration={<IconDisc icon={WifiSlash} />}
      title={t('mine.error')}
      action={{ label: t('common.retry'), onPress: () => void list.refetch() }}
    />
  ) : (
    <EmptyState
      artwork={empty.artwork}
      illustration={<IconDisc icon={empty.icon} />}
      title={t(`mine.empty.${scope}.title`)}
      description={t(`mine.empty.${scope}.body`)}
      action={{ label: t(`mine.empty.${scope}.action`), onPress: empty.onPress }}
    />
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlashList<Activity>
        data={list.isPending ? [] : list.activities}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ActivityCard activity={item} now={now} />
            <AfterActivityActions activity={item} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyView}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={() => void list.refetch()}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  header: {
    gap: t.spacing.lg,
    paddingHorizontal: t.spacing.screen,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    padding: t.spacing.xs,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceMuted,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.sm,
    paddingHorizontal: t.spacing.xs,
  },
  tabSelected: { backgroundColor: t.colors.surface },
  list: { paddingBottom: t.spacing.xxxl },
  item: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.lg, gap: t.spacing.sm },
  skeletons: { paddingHorizontal: t.spacing.screen },
}));
