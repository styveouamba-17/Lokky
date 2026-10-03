// Chaque activité a un chat de groupe (spec §6.3) : son identifiant dérive de celui de l'activité.
const GROUP_PREFIX = 'c_';

export const groupConversationId = (activityId: string) => `${GROUP_PREFIX}${activityId}`;

export const activityIdOfConversation = (conversationId: string) =>
  conversationId.startsWith(GROUP_PREFIX) ? conversationId.slice(GROUP_PREFIX.length) : null;

// Conversation privée : une seule par paire, quel que soit qui l'ouvre.
const DIRECT_PREFIX = 'd_';
const SEPARATOR = '__';

export const directConversationId = (a: string, b: string) =>
  `${DIRECT_PREFIX}${[a, b].sort().join(SEPARATOR)}`;

export function usersOfDirect(conversationId: string): [string, string] | null {
  if (!conversationId.startsWith(DIRECT_PREFIX)) return null;
  const [a, b, ...rest] = conversationId.slice(DIRECT_PREFIX.length).split(SEPARATOR);
  return a && b && rest.length === 0 ? [a, b] : null;
}
