import { create } from 'zustand';

// Conversation affichée à l'écran : pas de non-lu ni de notification pour elle.
// Partagée par le chat (qui la renseigne) et les notifications (qui la lisent).
export const useActiveConversation = create<{ id: string | null }>()(() => ({ id: null }));
