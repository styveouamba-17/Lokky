import type { BlockedUser } from '@lokky/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Prohibit } from 'phosphor-react-native/src/icons/Prohibit';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { formatDayAndHour } from '@/lib';
import { makeStyles } from '@/theme';
import { Avatar, Button, EmptyState, IconDisc, ScreenHeader, Skeleton, Text, useToast } from '@/ui';
import { listBlocks, unblockUser } from '../api';

const BLOCKS_KEY = ['settings', 'blocks'] as const;

// Personnes bloquées (spec §6.2) : on peut les débloquer ici.
export function BlockedScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const blocks = useQuery({ queryKey: BLOCKS_KEY, queryFn: () => listBlocks() });
  const unblock = useMutation({
    mutationFn: (user: BlockedUser) => unblockUser(user.id),
    onSuccess: (_ok, user) =>
      toast.show(t('profile.unblocked', { name: user.firstName }), 'success'),
    onError: () => toast.show(t('settings.error'), 'error'),
    // Débloquer change le fil, les chats et les profils : on resynchronise tout.
    onSettled: () => queryClient.invalidateQueries(),
  });
  const now = new Date();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t('settings.blockedList.title')} onBack={() => router.back()} />
      {blocks.isPending ? (
        <View style={styles.content}>
          <Skeleton height={56} />
        </View>
      ) : (
        <FlatList
          data={blocks.data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar name={item.firstName} uri={item.avatarUrl} size="md" />
              <View style={styles.text}>
                <Text variant="bodyStrong">{item.firstName}</Text>
                <Text variant="caption" color="textMuted">
                  {t('settings.blockedList.since', { date: formatDayAndHour(item.blockedAt, now) })}
                </Text>
              </View>
              <Button
                label={t('profile.unblock')}
                variant="secondary"
                size="sm"
                disabled={unblock.isPending}
                onPress={() => unblock.mutate(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              artwork="empty-blocked"
              illustration={<IconDisc icon={Prohibit} />}
              title={t('settings.blockedList.emptyTitle')}
              description={t('settings.blockedList.emptyBody')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.screen, gap: t.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  text: { flex: 1, gap: 2 },
}));
