import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useChatStore } from '../chatStore';
import { getConversation, getGroupActivity, listConversations } from '../api';
import { chatKeys } from '../queryKeys';

export function useConversations() {
  const result = useInfiniteQuery({
    queryKey: chatKeys.conversations,
    queryFn: ({ pageParam }) => listConversations(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  return { ...result, conversations: result.data?.pages.flatMap((p) => p.items) ?? [] };
}

// Le total serveur couvre toutes les conversations ; avant la première synchro, on utilise
// les conversations déjà chargées pour garder le badge réactif.
export function useUnreadTotal(): number {
  const serverTotal = useChatStore((state) => state.unreadTotal);
  const { conversations } = useConversations();
  return serverTotal ?? conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

export const useConversation = (id: string) =>
  useQuery({ queryKey: chatKeys.conversation(id), queryFn: () => getConversation(id) });

export const useGroupActivity = (activityId: string | null | undefined) =>
  useQuery({
    queryKey: chatKeys.activity(activityId ?? ''),
    queryFn: () => getGroupActivity(activityId ?? ''),
    enabled: Boolean(activityId),
  });
