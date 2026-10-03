import type { UserPreview } from '@lokky/shared';
import { create } from 'zustand';

// État éphémère du chat : qui écrit, par conversation. La conversation ouverte vit dans
// state/activeConversation.ts (les notifications la lisent aussi).
interface ChatState {
  typing: Record<string, UserPreview[]>;
  setTyping: (conversationId: string, user: UserPreview, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  typing: {},
  setTyping: (conversationId, user, isTyping) =>
    set((s) => {
      const others = (s.typing[conversationId] ?? []).filter((u) => u.id !== user.id);
      return { typing: { ...s.typing, [conversationId]: isTyping ? [...others, user] : others } };
    }),
}));
