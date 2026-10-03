import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';

// Français d'abord (spec §4.2). L'anglais réutilisera les mêmes clés dans en.json.
export const resources = { fr: { translation: fr } } as const;

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
