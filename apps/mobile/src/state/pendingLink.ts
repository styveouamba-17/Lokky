import { create } from 'zustand';

// Sortie à ouvrir après un lien (lokky.akylian.com/activity/:id). Le lien peut arriver avant
// la connexion : il attend ici que l'utilisateur soit dans l'app (app/+native-intent.tsx).
export const usePendingLink = create<{ activityId: string | null }>()(() => ({
  activityId: null,
}));

const ACTIVITY_PATH = /\/activity\/([A-Za-z0-9_-]+)/;

// Accepte une URL complète (https://…, lokky://…) ou un simple chemin. null : pas une sortie.
export function activityIdFromLink(link: string): string | null {
  return ACTIVITY_PATH.exec(link)?.[1] ?? null;
}

// Utilisé par app/+native-intent.tsx. Un lien vers une sortie passe par l'accueil : la garde
// choisit l'écran selon la session, puis les onglets ouvrent la sortie. Ne lève jamais.
export function redirectForLink(path: string): string {
  try {
    const activityId = activityIdFromLink(path);
    if (!activityId) return path;
    usePendingLink.setState({ activityId });
    return '/';
  } catch {
    return '/';
  }
}
