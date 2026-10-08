export const chatKeys = {
  all: ['chat'] as const,
  conversations: ['chat', 'conversations'] as const,
  conversation: (id: string) => ['chat', 'conversation', id] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
  activity: (id: string) => ['chat', 'activity', id] as const,
  participants: (id: string) => ['chat', 'participants', id] as const,
};
