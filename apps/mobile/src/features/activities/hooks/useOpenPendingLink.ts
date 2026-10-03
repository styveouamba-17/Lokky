import { router } from 'expo-router';
import { useEffect } from 'react';
import { usePendingLink } from '@/state/pendingLink';

// Monté avec les onglets (utilisateur connecté) : ouvre la sortie d'un lien reçu, tout de
// suite ou dès l'arrivée dans l'app.
export function useOpenPendingLink() {
  const activityId = usePendingLink((s) => s.activityId);
  useEffect(() => {
    if (!activityId) return;
    usePendingLink.setState({ activityId: null });
    router.push({ pathname: '/activity/[id]', params: { id: activityId } });
  }, [activityId]);
}
