import type { UpdateMessageInput } from '@lokky/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMessage } from '../api';
import { receiveUpdatedMessage } from '../cache';

export function useEditMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMessageInput) => updateMessage(input),
    onSuccess: (message) => receiveUpdatedMessage(queryClient, message),
  });
}
