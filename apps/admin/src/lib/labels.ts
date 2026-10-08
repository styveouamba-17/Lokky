import {
  NEIGHBORHOODS,
  type ActivityCategory,
  type ActivityStatus,
  type ModerationStatus,
  type NeighborhoodId,
  type UserStatus,
} from '@lokky/shared';
import type { ReportStatus, StaffRole } from '@lokky/shared/admin';

// Libellés de l'admin : mêmes mots que l'app (apps/mobile/src/i18n/fr.json).

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  sport: 'Sport',
  beach: 'Plage',
  cinema: 'Ciné',
  study: 'Études',
  music: 'Musique et sorties',
  games: 'Jeux',
  food: 'Food et thé',
  culture: 'Culture',
  walk: 'Balade',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  student: 'Étudiant·e',
  newcomer: 'Nouvel·le arrivant·e',
  other: 'Autre',
};

export const REASON_LABELS: Record<string, string> = {
  harassment: 'Harcèlement ou menaces',
  inappropriate: 'Contenu inapproprié',
  fake: 'Faux profil ou arnaque',
  dangerous: 'Comportement dangereux',
  spam: 'Spam ou publicité',
  other: 'Autre chose',
};

export const MODERATION_LABELS: Record<ModerationStatus, string> = {
  active: 'Actif',
  warned: 'Averti',
  suspended: 'Suspendu',
  banned: 'Banni',
};

// Ce que fait chaque décision, du point de vue de la personne.
export const MODERATION_ACTIONS: Record<ModerationStatus, { label: string; effect: string }> = {
  active: { label: 'Rétablir', effect: 'Le compte retrouve un accès normal.' },
  warned: {
    label: 'Avertir',
    effect: 'La personne reçoit une notification d’avertissement, sans restriction.',
  },
  suspended: {
    label: 'Suspendre',
    effect: 'Lecture seule pendant la durée choisie : plus de sorties, de messages ni d’avis.',
  },
  banned: { label: 'Bannir', effect: 'Le compte est fermé définitivement.' },
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  upcoming: 'À venir',
  ongoing: 'En cours',
  past: 'Passée',
  cancelled: 'Annulée',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'À traiter',
  resolved: 'Traité',
  dismissed: 'Classé sans suite',
};

export const TARGET_LABELS = { user: 'Profil', activity: 'Sortie', message: 'Message' } as const;

export const ROLE_LABELS: Record<StaffRole, string> = {
  moderator: 'Modération',
  admin: 'Administration',
};

export const neighborhoodName = (id: NeighborhoodId | null) =>
  id ? NEIGHBORHOODS[id].name : 'Quartier inconnu';

export const displayName = (firstName: string | null) => firstName ?? 'Profil incomplet';
