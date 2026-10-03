import { useInfiniteQuery } from '@tanstack/react-query';
import { listMessages } from '../api';
import { chatKeys } from '../queryKeys';

// Du plus récent au plus ancien : la page suivante charge l'historique (liste inversée).
export function useMessages(conversationId: string) {
  const result = useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: ({ pageParam }) => listMessages(conversationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    // Le socket tient la liste à jour : pas de rechargement à chaque retour sur l'écran.
    staleTime: Infinity,
  });
  return { ...result, messages: result.data?.pages.flatMap((p) => p.items) ?? [] };
}
