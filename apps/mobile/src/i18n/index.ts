import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fr from './fr.json';

// Français et anglais (mêmes clés : vérifié par un test). Le français reste la langue de
// départ et de repli ; la langue choisie (préférences) est appliquée par app/_layout.tsx.
export const resources = { fr: { translation: fr }, en: { translation: en } } as const;

const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false }, // React échappe déjà
  returnNull: false,
  initAsync: false, // ressources intégrées : traductions prêtes dès le premier rendu
});

export { i18n };
export { useTranslation } from 'react-i18next';
