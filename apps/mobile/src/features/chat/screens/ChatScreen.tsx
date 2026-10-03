import type { UserPreview } from '@lokky/shared';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { ChatsCircle } from 'phosphor-react-native/src/icons/ChatsCircle';
import { LockSimple } from 'phosphor-react-native/src/icons/LockSimple';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { formatActivityWhen } from '@/lib';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import { Avatar, EmptyState, IconButton, IconDisc, Illustration, Skeleton, Text } from '@/ui';
import { useChatStore } from '../chatStore';
import { ChatBubble } from '../components/ChatBubble';
import { Composer } from '../components/Composer';
import { PinnedMeetupBanner } from '../components/PinnedMeetupBanner';
import { DaySeparator, SystemMessage, TypingIndicator } from '../components/TimelineMarkers';
import { useConversation, useGroupActivity } from '../hooks/useConversations';
import { useMarkRead } from '../hooks/useMarkRead';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';
import { useOutbox } from '../outbox';
import { buildTimeline, type TimelineItem } from '../timeline';

const NO_ONE: readonly UserPreview[] = [];

// Chat de groupe (spec §6.2) : en-tête avec la sortie, RDV épinglé, bulles, saisie.
export function ChatScreen({ id }: { id: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const viewerId = useSessionStore((s) => s.me?.id ?? null);
  const conversation = useConversation(id);
  const activity = useGroupActivity(conversation.data?.activityId);
  const messages = useMessages(id);
  const allOutgoing = useOutbox((s) => s.items);
  const typing = useChatStore((s) => s.typing[id] ?? NO_ONE);
  const { send, resend } = useSendMessage(id);
  const now = new Date();

  const outgoing = useMemo(
    () => allOutgoing.filter((o) => o.conversationId === id),
    [allOutgoing, id],
  );
  const timeline = useMemo(
    () => buildTimeline({ messages: messages.messages, outgoing, viewerId, now: new Date() }),
    [messages.messages, outgoing, viewerId],
  );
  useMarkRead(id, messages.messages[0]?.id);

  const back = (
    <IconButton
      accessibilityLabel={t('common.back')}
      onPress={() => router.back()}
      icon={<ArrowLeft size={24} color={colors.text} weight="bold" />}
    />
  );

  if (conversation.isError || messages.isError) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>{back}</View>
        <EmptyState
          illustration={<IconDisc icon={ChatsCircle} />}
          title={t('chat.loadError')}
          description={t('chat.notMember')}
          action={{ label: t('common.back'), onPress: () => router.back() }}
        />
      </View>
    );
  }

  const a = activity.data;
  // Message privé : l'en-tête montre l'autre personne et ouvre son profil.
  const peer = conversation.data?.peer ?? null;
  const openActivity = () => {
    if (conversation.data?.activityId)
      router.push({ pathname: '/activity/[id]', params: { id: conversation.data.activityId } });
  };
  const openHeader = () =>
    peer ? router.push({ pathname: '/user/[id]', params: { id: peer.id } }) : openActivity();
  const hasConversation = timeline.some((i) => i.kind === 'text');
  const readOnly = conversation.data?.isReadOnly ?? false;

  const renderItem = ({ item }: { item: TimelineItem }) => {
    if (item.kind === 'day') return <DaySeparator label={item.label} />;
    if (item.kind === 'system') return <SystemMessage body={item.body} />;
    return (
      <ChatBubble
        body={item.body}
        createdAt={item.createdAt}
        mine={item.mine}
        sender={item.sender}
        showSender={item.showSender}
        status={item.status}
        onRetry={item.clientId ? () => resend(item.clientId!) : undefined}
        onReport={
          item.id && !item.mine
            ? () =>
                router.push({
                  pathname: '/report',
                  params: { targetType: 'message', targetId: item.id! },
                })
            : undefined
        }
      />
    );
  };

  // Liste inversée : le « footer » s'affiche en haut, au-dessus des plus anciens messages.
  const top = messages.isFetchingNextPage ? (
    <ActivityIndicator color={colors.textMuted} style={styles.loader} />
  ) : !messages.isPending && !hasConversation ? (
    <View style={styles.firstMessage}>
      <Illustration name="chat-first-message" style={styles.artwork} />
      <Text variant="heading" align="center">
        {peer ? t('chat.firstMessageDirect', { name: peer.firstName }) : t('chat.firstMessage')}
      </Text>
      {peer ? null : (
        <Text color="textMuted" align="center">
          {t('chat.firstMessageBody')}
        </Text>
      )}
    </View>
  ) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {back}
        {peer ? <Avatar name={peer.firstName} uri={peer.avatarUrl} size="md" /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityHint={peer ? t('chat.openProfile') : t('chat.openActivity')}
          onPress={openHeader}
          style={styles.headerText}
        >
          {conversation.data ? (
            <Text variant="heading" accessibilityRole="header" numberOfLines={1}>
              {conversation.data.title}
            </Text>
          ) : (
            <Skeleton height={24} width="60%" />
          )}
          {a ? (
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {formatActivityWhen(a.startsAt, now)}
            </Text>
          ) : null}
        </Pressable>
      </View>
      {a ? <PinnedMeetupBanner activity={a} now={now} onPress={openActivity} /> : null}

      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        {messages.isPending ? (
          <View style={styles.skeletons}>
            <Skeleton height={44} width="60%" />
            <Skeleton height={44} width="45%" />
          </View>
        ) : (
          <FlatList
            inverted
            data={timeline}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            ListHeaderComponent={<TypingIndicator users={typing} />}
            ListFooterComponent={top}
            onEndReached={() => {
              if (messages.hasNextPage && !messages.isFetchingNextPage) {
                void messages.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            style={styles.flex}
          />
        )}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.surface }}
        >
          {readOnly ? (
            <View style={styles.readOnly}>
              <LockSimple size={18} color={colors.textMuted} />
              <Text variant="caption" color="textMuted" style={styles.flex}>
                {peer ? t('chat.readOnlyDirect') : t('chat.readOnly')}
              </Text>
            </View>
          ) : (
            <Composer onSend={send} />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.sm,
  },
  headerText: { flex: 1, gap: 2, paddingRight: t.spacing.lg },
  list: { paddingVertical: t.spacing.md, gap: t.spacing.sm },
  loader: { paddingVertical: t.spacing.md },
  skeletons: { flex: 1, justifyContent: 'flex-end', padding: t.spacing.lg, gap: t.spacing.md },
  firstMessage: {
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.xxl,
    paddingVertical: t.spacing.xl,
  },
  artwork: { maxWidth: 240, marginBottom: t.spacing.sm },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: t.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
}));
