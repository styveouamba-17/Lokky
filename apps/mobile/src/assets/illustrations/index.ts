import type { ActivityCategory, ActivityCover } from '@lokky/shared';
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
  'onboarding-permissions': require('../../../assets/onboarding-permissions.png'),
  'empty-no-activity': require('../../../assets/empty-no-activity.png'),
  'empty-offline': require('../../../assets/empty-offline.png'),
  'empty-past': require('../../../assets/empty-past.png'),
  'empty-upcoming': require('../../../assets/empty-upcoming.png'),
  'empty-created': require('../../../assets/empty-created.png'),
  'empty-messages': require('../../../assets/empty-messages.png'),
  'chat-first-message': require('../../../assets/chat-first-message.png'),
  'dm-locked': require('../../../assets/dm-locked.png'),
  'activity-gone': require('../../../assets/activity-gone.png'),
  'create-published': require('../../../assets/create-published.png'),
  'review-thanks': require('../../../assets/review-thanks.png'),
  'empty-blocked': require('../../../assets/empty-blocked.png'),
  'moderation-suspended': require('../../../assets/moderation-suspended.png'),
  'moderation-banned': require('../../../assets/moderation-banned.png'),
  'error-generic': require('../../../assets/error-generic.png'),
  // 'account-deleted': require('../../../assets/account-deleted.png'),
};

// Couvertures d'activité (docs/illustrations.md) : galerie dans laquelle le créateur choisit,
// générée depuis assets/activities-paints par `npm run covers`. Chaque identifiant vient de
// ACTIVITY_COVERS (contrat partagé).
// - categories : catégories pour lesquelles l'image est proposée en premier.
// - auto : utilisée quand le créateur laisse « Automatique » (plusieurs par catégorie possibles :
//   une sortie garde toujours la même). Une catégorie sans image auto s'affiche sans bandeau.
// - focusY : hauteur (en %) à garder visible quand l'image est recadrée en bandeau.
export interface CoverImage {
  source: ImageSourcePropType;
  categories: readonly ActivityCategory[];
  auto?: boolean;
  focusY: number;
}

export const COVER_IMAGES: Record<ActivityCover, CoverImage> = {
  'beach-football': {
    source: require('../../../assets/covers/beach-football.webp'),
    categories: ['sport', 'beach'],
    focusY: 55,
  },
  karting: {
    source: require('../../../assets/covers/karting.webp'),
    categories: ['sport'],
    focusY: 50,
  },
  padel: {
    source: require('../../../assets/covers/padel.webp'),
    categories: ['sport'],
    focusY: 65,
  },
  tennis: {
    source: require('../../../assets/covers/tennis.webp'),
    categories: ['sport'],
    focusY: 58,
  },
  'running-corniche': {
    source: require('../../../assets/covers/running-corniche.webp'),
    categories: ['sport', 'walk'],
    focusY: 38,
  },
  kayak: {
    source: require('../../../assets/covers/kayak.webp'),
    categories: ['beach', 'sport'],
    focusY: 52,
  },
  'beach-friends': {
    source: require('../../../assets/covers/beach-friends.webp'),
    categories: ['beach'],
    auto: true,
    focusY: 50,
  },
  'bike-corniche': {
    source: require('../../../assets/covers/bike-corniche.webp'),
    categories: ['walk', 'sport'],
    focusY: 42,
  },
  'corniche-walk': {
    source: require('../../../assets/covers/corniche-walk.webp'),
    categories: ['walk'],
    auto: true,
    focusY: 50,
  },
  'ferry-goree': {
    source: require('../../../assets/covers/ferry-goree.webp'),
    categories: ['walk', 'culture', 'beach'],
    focusY: 50,
  },
  'mamelles-sunset': {
    source: require('../../../assets/covers/mamelles-sunset.webp'),
    categories: ['walk'],
    focusY: 62,
  },
  museum: {
    source: require('../../../assets/covers/museum.webp'),
    categories: ['culture'],
    focusY: 42,
  },
  'open-air-cinema': {
    source: require('../../../assets/covers/open-air-cinema.webp'),
    categories: ['cinema'],
    auto: true,
    focusY: 45,
  },
  concert: {
    source: require('../../../assets/covers/concert.webp'),
    categories: ['music'],
    auto: true,
    focusY: 50,
  },
  'thieb-table': {
    source: require('../../../assets/covers/thieb-table.webp'),
    categories: ['food'],
    auto: true,
    focusY: 50,
  },
};
