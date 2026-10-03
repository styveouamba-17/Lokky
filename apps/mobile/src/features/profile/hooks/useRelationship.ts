import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blockUser, openDirect, unblockUser } from '../api';

export const useOpenDirect = () =>
  useMutation({ mutationFn: (userId: string) => openDirect(userId) });

// Bloquer change ce qu'on voit partout (fil, chats, profils) : on resynchronise tout.
export function useBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, block }: { userId: string; block: boolean }) =>
      block ? blockUser(userId) : unblockUser(userId),
    onSettled: () => queryClient.invalidateQueries(),
  });
}
