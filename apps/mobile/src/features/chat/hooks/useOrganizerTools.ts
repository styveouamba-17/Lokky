import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelGroupActivity, getGroupParticipants, removeGroupParticipant } from '../api';
import { chatKeys } from '../queryKeys';

export const useGroupParticipants = (activityId: string) =>
  useQuery({
    queryKey: chatKeys.participants(activityId),
    queryFn: () => getGroupParticipants(activityId),
  });

export function useCancelGroupActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) => cancelGroupActivity(activityId),
    onSuccess: () => void queryClient.invalidateQueries(),
  });
}

export function useRemoveGroupParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, userId }: { activityId: string; userId: string }) =>
      removeGroupParticipant(activityId, userId),
    onSuccess: () => void queryClient.invalidateQueries(),
  });
}
