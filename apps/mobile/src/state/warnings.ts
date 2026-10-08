import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WarningsState {
  // Par compte : date du dernier avertissement déjà lu sur ce téléphone.
  seen: Record<string, string>;
  acknowledge: (userId: string, warnedAt: string) => void;
}

// Avertissements de l'équipe déjà affichés : chacun n'apparaît qu'une fois (spec admin).
export const useWarningsStore = create<WarningsState>()(
  persist(
    (set) => ({
      seen: {},
      acknowledge: (userId, warnedAt) =>
        set((state) => ({ seen: { ...state.seen, [userId]: warnedAt } })),
    }),
    { name: 'lokky.warnings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
