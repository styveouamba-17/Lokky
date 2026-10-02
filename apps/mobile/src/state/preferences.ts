import { create } from 'zustand';
import type { ThemePreference } from '@/theme';

interface PreferencesState {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

// Persistance (AsyncStorage) ajoutée au jalon 7, avec l'écran Réglages.
export const usePreferencesStore = create<PreferencesState>()((set) => ({
  themePreference: 'system',
  setThemePreference: (themePreference) => set({ themePreference }),
}));
