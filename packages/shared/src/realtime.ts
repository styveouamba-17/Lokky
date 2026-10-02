import type { Activity } from './schemas/activity';
import type { Message } from './schemas/chat';
import type { ModerationStatus, UserPreview } from './schemas/user';

// Les messages s'envoient par HTTP (messages.send) ; le socket ne sert qu'à recevoir.
export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  typing: (payload: { conversationId: string; user: UserPreview; isTyping: boolean }) => void;
  'conversation:read': (payload: {
    conversationId: string;
    userId: string;
    readAt: string;
  }) => void;
  'unread:update': (payload: { total: number }) => void;
  'activity:updated': (activity: Activity) => void;
  'activity:cancelled': (payload: { activityId: string }) => void;
  'moderation:update': (payload: {
    status: ModerationStatus;
    suspendedUntil: string | null;
  }) => void;
}

export interface ClientToServerEvents {
  'conversation:join': (payload: { conversationId: string }) => void;
  'conversation:leave': (payload: { conversationId: string }) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
}
