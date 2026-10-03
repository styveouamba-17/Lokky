import { useMutation } from '@tanstack/react-query';
import { useSessionStore } from '@/state/session';
import { signInWithOAuth } from '../api';
import { signInWithApple, signInWithGoogle, type OAuthProvider } from '../providers';

// Fenêtre native Apple / Google → jeton → API → session. Renvoie null si l'utilisateur annule.
export function useSocialSignIn() {
  const signIn = useSessionStore((s) => s.signIn);
  return useMutation({
    mutationFn: async (provider: OAuthProvider) => {
      const credential = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
      if (!credential) return null;
      const result = await signInWithOAuth(credential);
      await signIn(result, credential.firstName);
      return result;
    },
  });
}
