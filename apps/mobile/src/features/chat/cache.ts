import type { Conversation, Message, Paginated } from '@lokky/shared';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { chatKeys } from './queryKeys';

type Pages<T> = InfiniteData<Paginated<T>, string | undefined>;

// Ajoute un message en tête de la première page (la plus récente), sans doublon.
export function withMessage(data: Pages<Message> | undefined, message: Message) {
  if (!data) return data;
  if (data.pages.some((p) => p.items.some((m) => m.id === message.id))) return data;
  const [first, ...rest] = data.pages;
  if (!first) return data;
  return { ...data, pages: [{ ...first, items: [message, ...first.items] }, ...rest] };
}

export function withUpdatedMessage(data: Pages<Message> | undefined, message: Message) {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => {
        if (item.id === message.id) return message;
        if (item.replyTo?.id === message.id) {
          return {
            ...item,
            replyTo: {
              ...item.replyTo,
              body: message.body,
              sender: message.sender,
            },
          };
        }
        return item;
      }),
    })),
  };
}

// Met la conversation à jour et la remonte en tête de liste. false si elle n'y est pas.
export function withLastMessage(
  data: Pages<Conversation> | undefined,
  message: Message,
  { countAsUnread }: { countAsUnread: boolean },
): Pages<Conversation> | null {
  const current = data?.pages.flatMap((p) => p.items).find((c) => c.id === message.conversationId);
  if (!data || !current) return null;
  const updated: Conversation = {
    ...current,
    lastMessage: message,
    updatedAt: message.createdAt,
    unreadCount: countAsUnread ? current.unreadCount + 1 : current.unreadCount,
  };
  const pages = data.pages.map((p, i) => {
    const items = p.items.filter((c) => c.id !== updated.id);
    return { ...p, items: i === 0 ? [updated, ...items] : items };
  });
  return { ...data, pages };
}

export function receiveUpdatedMessage(queryClient: QueryClient, message: Message) {
  queryClient.setQueryData<Pages<Message>>(chatKeys.messages(message.conversationId), (data) =>
    withUpdatedMessage(data, message),
  );
  queryClient.setQueryData<Pages<Conversation>>(chatKeys.conversations, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((conversation) =>
          conversation.lastMessage?.id === message.id
            ? { ...conversation, lastMessage: message }
            : conversation.lastMessage?.replyTo?.id === message.id
              ? {
                  ...conversation,
                  lastMessage: {
                    ...conversation.lastMessage,
                    replyTo: { ...conversation.lastMessage.replyTo, body: message.body },
                  },
                }
              : conversation,
        ),
      })),
    };
  });
}

export function receiveMessage(
  queryClient: QueryClient,
  message: Message,
  {
    viewerId,
    activeConversationId,
  }: { viewerId: string | null; activeConversationId: string | null },
) {
  const { conversationId } = message;
  queryClient.setQueryData<Pages<Message>>(chatKeys.messages(conversationId), (data) =>
    withMessage(data, message),
  );
  const countAsUnread =
    message.type === 'text' &&
    message.sender?.id !== viewerId &&
    conversationId !== activeConversationId;
  const list = queryClient.getQueryData<Pages<Conversation>>(chatKeys.conversations);
  const next = withLastMessage(list, message, { countAsUnread });
  if (next) queryClient.setQueryData(chatKeys.conversations, next);
  else void queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
}

// Conversation lue : le badge disparaît tout de suite, sans attendre le serveur.
export function clearUnread(queryClient: QueryClient, conversationId: string) {
  queryClient.setQueryData<Pages<Conversation>>(chatKeys.conversations, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((p) => ({
            ...p,
            items: p.items.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
          })),
        }
      : data,
  );
}
