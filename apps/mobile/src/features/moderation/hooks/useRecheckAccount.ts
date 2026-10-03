import { useMutation } from '@tanstack/react-query';
import { getMe } from '../api';
import { useSessionStore } from '@/state/session';

// Relit le profil : si la suspension est levée, la garde rouvre l'app d'elle-même.
export function useRecheckAccount() {
  const setMe = useSessionStore((s) => s.setMe);
  return useMutation({
    mutationFn: async () => {
      const me = await getMe();
      await setMe(me);
      return me;
    },
  });
}
