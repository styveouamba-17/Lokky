import { i18n } from '@/i18n';

// Langue de l'app (Réglages › Apparence et langue). Les formateurs de lib/ la lisent ici :
// les écrans se redessinent au changement de langue (useTranslation), donc les dates aussi.
export type Language = 'fr' | 'en';

export const currentLanguage = (): Language => (i18n.language === 'en' ? 'en' : 'fr');
