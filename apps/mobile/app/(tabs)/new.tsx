// Onglet factice : l'appui ouvre /create en plein écran (voir (tabs)/_layout.tsx).
export default function NewTab() {
  return null;
}

// Si cet écran plante : écran d'erreur illustré, erreur signalée à Sentry.
export { RouteErrorBoundary as ErrorBoundary } from '@/ui';
