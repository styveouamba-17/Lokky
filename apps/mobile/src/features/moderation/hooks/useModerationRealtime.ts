import { useEffect } from 'react';
import { realtime } from '@/api/client';
import { useSessionStore } from '@/state/session';

// Suspension ou bannissement en cours de route (spec §7.1, moderation:update) : le profil de
// la session change, et la garde de navigation bascule sur l'écran de modération.
export function useModerationRealtime() {
  useEffect(
    () =>
      realtime.on('moderation:update', (moderation) => {
        const { me, setMe } = useSessionStore.getState();
        if (me) void setMe({ ...me, moderation });
      }),
    [],
  );
}
