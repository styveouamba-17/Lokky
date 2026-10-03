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
  // Couvertures de catégorie
  'category-sport',
  'category-beach',
  'category-cinema',
  'category-study',
  'category-music',
  'category-games',
  'category-food',
  'category-culture',
  'category-walk',
] as const;

export type IllustrationName = (typeof ILLUSTRATION_NAMES)[number];

export const ILLUSTRATIONS: Partial<Record<IllustrationName, ImageSourcePropType>> = {
  'welcome-tonight': require('../../../assets/welcome-tonight.png'),
  'welcome-together': require('../../../assets/welcome-together.png'),
  // 'onboarding-permissions': require('./onboarding-permissions.png'),
  'empty-no-activity': require('../../../assets/empty-no-activity.png'),
  // 'empty-offline': require('./empty-offline.png'),
  'empty-upcoming': require('../../../assets/empty-upcoming.png'),
  // 'empty-past': require('./empty-past.png'),
  'empty-created': require('../../../assets/empty-created.png'),
  'empty-messages': require('../../../assets/empty-messages.png'),
  'chat-first-message': require('../../../assets/chat-first-message.png'),
  // 'dm-locked': require('./dm-locked.png'),
  // 'activity-gone': require('./activity-gone.png'),
  // 'create-published': require('./create-published.png'),
  // 'review-thanks': require('./review-thanks.png'),
  // 'empty-blocked': require('./empty-blocked.png'),
  // 'moderation-suspended': require('./moderation-suspended.png'),
  // 'moderation-banned': require('./moderation-banned.png'),
  // 'error-generic': require('./error-generic.png'),
  // 'account-deleted': require('./account-deleted.png'),
  // 'category-sport': require('./category-sport.png'),
  // 'category-beach': require('./category-beach.png'),
  // 'category-cinema': require('./category-cinema.png'),
  // 'category-study': require('./category-study.png'),
  // 'category-music': require('./category-music.png'),
  // 'category-games': require('./category-games.png'),
  // 'category-food': require('./category-food.png'),
  // 'category-culture': require('./category-culture.png'),
  // 'category-walk': require('./category-walk.png'),
};
