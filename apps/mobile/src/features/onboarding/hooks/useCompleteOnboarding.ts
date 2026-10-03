import type { OnboardingProfile } from '@lokky/shared';
import { useMutation } from '@tanstack/react-query';
import { useSessionStore } from '@/state/session';
import { completeOnboarding, setAvatarUrl, uploadAvatar } from '../api';

// Profil → API, puis avatar facultatif. La session passe à signedIn : la garde ouvre l'app.
export function useCompleteOnboarding() {
  const setMe = useSessionStore((s) => s.setMe);
  return useMutation({
    mutationFn: async ({
      profile,
      avatarUri,
    }: {
      profile: OnboardingProfile;
      avatarUri: string | null;
    }) => {
      let me = await completeOnboarding(profile);
      if (avatarUri) {
        // Une photo qui ne passe pas ne doit pas bloquer l'inscription : on garde le profil.
        try {
          me = await setAvatarUrl(await uploadAvatar(avatarUri));
        } catch {
          // l'avatar pourra être ajouté depuis le profil
        }
      }
      await setMe(me);
      return me;
    },
  });
}
