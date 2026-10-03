import { pushDataSchema } from '@lokky/shared';
import type { Href } from 'expo-router';

// Écran à ouvrir quand on touche une notification. null : données inconnues ou invalides
// (ancienne version du serveur, notification d'un autre service) : on ouvre juste l'app.
export function hrefForPush(data: unknown): Href | null {
  const parsed = pushDataSchema.safeParse(data);
  if (!parsed.success) return null;
  const push = parsed.data;
  if (push.type === 'message') {
    return { pathname: '/chat/[id]', params: { id: push.conversationId } };
  }
  // Rejoint, modifiée, annulée, rappel, après la sortie : tout se passe sur le détail
  // (les boutons « Laisser un avis » et « Qui est venu ? » y sont).
  return { pathname: '/activity/[id]', params: { id: push.activityId } };
}

// Une notification de message pour la conversation déjà à l'écran n'a pas besoin de bannière.
export function isForOpenConversation(data: unknown, openConversationId: string | null) {
  const parsed = pushDataSchema.safeParse(data);
  return (
    parsed.success &&
    parsed.data.type === 'message' &&
    parsed.data.conversationId === openConversationId
  );
}
