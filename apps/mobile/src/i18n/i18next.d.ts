import 'i18next';
import type fr from './fr.json';

// Clés typées : t('login.title') est vérifié par TypeScript.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof fr };
  }
}
