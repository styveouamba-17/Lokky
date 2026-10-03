import type { Preferences } from '@lokky/shared';
import { useMutation } from '@tanstack/react-query';
import { useSessionStore } from '@/state/session';
import { updateMe } from '../api';

// Préférences du compte : appliquées tout de suite, annulées si le serveur refuse.
export function useUpdatePreferences() {
  return useMutation({
    mutationFn: (preferences: Preferences) => updateMe({ preferences }),
    onMutate: async (preferences) => {
      const { me, setMe } = useSessionStore.getState();
      if (!me) return { previous: null };
      await setMe({ ...me, preferences });
      return { previous: me };
    },
    onError: (_error, _preferences, context) => {
      if (context?.previous) void useSessionStore.getState().setMe(context.previous);
    },
    onSuccess: (me) => useSessionStore.getState().setMe(me),
  });
}
