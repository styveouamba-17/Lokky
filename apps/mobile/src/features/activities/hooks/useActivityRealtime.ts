import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { realtime } from '@/api/client';
import { activityKeys } from '../queryKeys';

// Sortie modifiée ou annulée pendant qu'on regarde l'app (spec §7.1) : le détail se met à jour
// tout de suite, les listes se resynchronisent.
export function useActivityRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const offs = [
      realtime.on('activity:updated', (activity) => {
        queryClient.setQueryData(activityKeys.detail(activity.id), activity);
        void queryClient.invalidateQueries({ queryKey: activityKeys.all });
      }),
      realtime.on('activity:cancelled', () => {
        void queryClient.invalidateQueries({ queryKey: activityKeys.all });
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [queryClient]);
}
