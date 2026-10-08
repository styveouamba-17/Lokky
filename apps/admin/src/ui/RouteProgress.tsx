import { useRouterState } from '@tanstack/react-router';

// Barre fine en haut de page pendant un changement de page. Elle n'apparaît qu'au-delà de
// 150 ms (délai en CSS) : une navigation instantanée ne clignote pas.
export function RouteProgress() {
  const pending = useRouterState({ select: (s) => s.status === 'pending' });
  return pending ? (
    <div className="route-progress" role="progressbar" aria-label="Chargement" />
  ) : null;
}
