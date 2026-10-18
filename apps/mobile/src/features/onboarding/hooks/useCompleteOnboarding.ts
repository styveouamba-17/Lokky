import type { OnboardingProfile } from '@lokky/shared';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { useToast } from '@/ui';
import { completeOnboarding, setAvatarUrl, uploadAvatar } from '../api';

// Profil → API. La session passe à signedIn : la garde ouvre l'app. La photo est facultative :
// si son envoi échoue, le profil est quand même validé (elle s'ajoute ensuite depuis le profil).
export function useCompleteOnboarding() {
  const setMe = useSessionStore((s) => s.setMe);
  const toast = useToast();
  const { t } = useTranslation();
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
        try {
          me = await setAvatarUrl(await uploadAvatar(avatarUri));
        } catch (error) {
          if (__DEV__) console.error('[Avatar] Upload during onboarding failed.', error);
          // Affiché avant de quitter l'écran : le toast reste visible dans l'app.
          toast.show(t('onboarding.errors.photoUpload'), 'error');
        }
      }
      await setMe(me);
      return me;
    },
  });
}
