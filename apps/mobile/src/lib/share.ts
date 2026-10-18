// Lien public d'une sortie : ouvre l'app si elle est installée (liens universels), sinon le site.
export const WEB_ORIGIN = 'https://lokky.app';
export const activityUrl = (id: string) => `${WEB_ORIGIN}/activity/${encodeURIComponent(id)}`;
