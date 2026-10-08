import type { OnboardingProfile } from '@lokky/shared';
import { useMutation } from '@tanstack/react-query';
import { useSessionStore } from '@/state/session';
import { completeOnboarding } from '../api';

// Profil → API. La session passe à signedIn : la garde ouvre l'app.
export function useCompleteOnboarding() {
  const setMe = useSessionStore((s) => s.setMe);
  return useMutation({
    mutationFn: async ({ profile }: { profile: OnboardingProfile }) => {
      const me = await completeOnboarding(profile);
      await setMe(me);
      return me;
    },
  });
}
