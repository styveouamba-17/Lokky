import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMessage } from '../api';
import { receiveUpdatedMessage } from '../cache';

// Le serveur renvoie le message vidé (« Message supprimé ») : même mise à jour qu'une modification.
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: (message) => receiveUpdatedMessage(queryClient, message),
  });
}
