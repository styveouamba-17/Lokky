import { useMutation } from '@tanstack/react-query';
import { requestEmailCode } from '../api';

export function useEmailCode() {
  return useMutation({ mutationFn: (email: string) => requestEmailCode(email) });
}
