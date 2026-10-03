import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ThemePreference } from '@/theme';

export type LanguagePreference = 'fr' | 'en';

// Premier lancement : la langue du téléphone si c'est l'anglais, sinon le français.
function deviceLanguage(): LanguagePreference {
  try {
    return getLocales()[0]?.languageCode === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

interface PreferencesState {
  themePreference: ThemePreference;
  language: LanguagePreference;
  setThemePreference: (preference: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
}

// Préférences d'affichage, gardées sur le téléphone (AsyncStorage) pour s'appliquer dès
// l'ouverture, même hors ligne. Le compte en garde aussi une copie (me.preferences).
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      language: deviceLanguage(),
      setThemePreference: (themePreference) => set({ themePreference }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'lokky.preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ themePreference, language }) => ({ themePreference, language }),
    },
  ),
);
