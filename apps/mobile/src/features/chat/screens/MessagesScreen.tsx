import type { Conversation } from '@lokky/shared';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ChatsCircle } from 'phosphor-react-native/src/icons/ChatsCircle';
import { WifiSlash } from 'phosphor-react-native/src/icons/WifiSlash';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles } from '@/theme';
import { EmptyState, IconDisc, Skeleton, Text } from '@/ui';
import { ConversationRow } from '../components/ConversationRow';
import { useConversations } from '../hooks/useConversations';

// Liste des discussions de groupe (spec §6.2). Les messages privés arrivent au jalon 7.
export function MessagesScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const viewerId = useSessionStore((s) => s.me?.id ?? null);
  const list = useConversations();
  const now = new Date();

  const empty = list.isPending ? (
    <View style={styles.skeletons}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={64} />
      ))}
    </View>
  ) : list.isError ? (
    <EmptyState
      artwork="empty-offline"
      illustration={<IconDisc icon={WifiSlash} />}
      title={t('messages.error')}
      action={{ label: t('common.retry'), onPress: () => void list.refetch() }}
    />
  ) : (
    <EmptyState
      artwork="empty-messages"
      illustration={<IconDisc icon={ChatsCircle} />}
      title={t('messages.emptyTitle')}
      description={t('messages.emptyBody')}
      action={{ label: t('messages.action'), onPress: () => router.navigate('/discover') }}
    />
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlashList<Conversation>
        data={list.isPending ? [] : list.conversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            viewerId={viewerId}
            now={now}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            {t('messages.title')}
          </Text>
        }
        ListEmptyComponent={empty}
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
  title: {
    paddingHorizontal: t.spacing.screen,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.sm,
  },
  list: { paddingBottom: t.spacing.xxxl },
  skeletons: { gap: t.spacing.md, paddingHorizontal: t.spacing.screen },
}));
