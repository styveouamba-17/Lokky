import { useMutation } from '@tanstack/react-query';
import { useSessionStore } from '@/state/session';
import { verifyEmailCode } from '../api';

// Code valide → session ouverte ; la garde de navigation prend le relais.
export function useVerifyCode(email: string) {
  const signIn = useSessionStore((s) => s.signIn);
  return useMutation({
    mutationFn: async (code: string) => {
      const result = await verifyEmailCode(email, code);
      await signIn(result);
      return result;
    },
  });
}
