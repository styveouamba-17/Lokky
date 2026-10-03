import type { ActivityCategory } from '@lokky/shared';
import type { ImageSourcePropType } from 'react-native';

// Illustrations peintes de Lokky (spec §3). Liste complète, scènes et formats :
// docs/illustrations.md. Pour en ajouter une : déposer le fichier dans ce dossier, puis
// décommenter sa ligne. Tant qu'une ligne reste commentée, l'écran affiche son visuel de
// remplacement : rien ne casse.

export const ILLUSTRATION_NAMES = [
  // Bienvenue
  'welcome-tonight',
  'welcome-together',
  // Onboarding
  'onboarding-permissions',
  // États vides et moments clés
  'empty-no-activity',
  'empty-offline',
  'empty-upcoming',
  'empty-past',
  'empty-created',
  'empty-messages',
  'chat-first-message',
  'dm-locked',
  'activity-gone',
  'create-published',
  'review-thanks',
  'empty-blocked',
  'moderation-suspended',
  'moderation-banned',
  'error-generic',
  'account-deleted',
] as const;

export type IllustrationName = (typeof ILLUSTRATION_NAMES)[number];

export const ILLUSTRATIONS: Partial<Record<IllustrationName, ImageSourcePropType>> = {
  'welcome-tonight': require('../../../assets/welcome-tonight.png'),
  'welcome-together': require('../../../assets/welcome-together.png'),
  // 'onboarding-permissions': require('./onboarding-permissions.png'),
  'empty-no-activity': require('../../../assets/empty-no-activity.png'),
  'empty-offline': require('../../../assets/empty-offline.png'),
  'empty-past': require('../../../assets/empty-past.png'),
  'empty-upcoming': require('../../../assets/empty-upcoming.png'),
  'empty-created': require('../../../assets/empty-created.png'),
  'empty-messages': require('../../../assets/empty-messages.png'),
  'chat-first-message': require('../../../assets/chat-first-message.png'),
  'dm-locked': require('../../../assets/dm-locked.png'),
  // 'activity-gone': require('./activity-gone.png'),
  'create-published': require('../../../assets/create-published.png'),
  'review-thanks': require('../../../assets/review-thanks.png'),
  'empty-blocked': require('../../../assets/empty-blocked.png'),
  // 'moderation-suspended': require('./moderation-suspended.png'),
  // 'moderation-banned': require('./moderation-banned.png'),
  // 'error-generic': require('./error-generic.png'),
  // 'account-deleted': require('./account-deleted.png'),
};

// Couvertures d'activité : une ou plusieurs variantes par catégorie (docs/illustrations.md).
// Une activité garde toujours la même variante. Tant qu'une catégorie n'a aucune image, ses
// cartes s'affichent sans bandeau. Pour en ajouter : déposer le fichier, décommenter sa ligne
// (ou en ajouter une : category-sport-3.png…).
export const CATEGORY_COVERS: Record<ActivityCategory, ImageSourcePropType[]> = {
  sport: [
    // require('./category-sport.png'),
    // require('./category-sport-2.png'),
  ],
  beach: [
    // require('./category-beach.png'),
    // require('./category-beach-2.png'),
  ],
  cinema: [
    // require('./category-cinema.png'),
    // require('./category-cinema-2.png'),
  ],
  study: [
    // require('./category-study.png'),
    // require('./category-study-2.png'),
  ],
  music: [
    // require('./category-music.png'),
    // require('./category-music-2.png'),
  ],
  games: [
    // require('./category-games.png'),
    // require('./category-games-2.png'),
  ],
  food: [
    // require('./category-food.png'),
    // require('./category-food-2.png'),
  ],
  culture: [
    // require('./category-culture.png'),
    // require('./category-culture-2.png'),
  ],
  walk: [
    // require('./category-walk.png'),
    // require('./category-walk-2.png'),
  ],
};
