import type { UpdateActivityInput } from '@lokky/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelActivity, updateActivity } from '../api';
import { activityKeys } from '../queryKeys';

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateActivityInput) => updateActivity(input),
    onSuccess: (activity) => {
      queryClient.setQueryData(activityKeys.detail(activity.id), activity);
      void queryClient.invalidateQueries();
    },
  });
}

export function useCancelActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelActivity(id),
    onSuccess: (activity) => {
      queryClient.setQueryData(activityKeys.detail(activity.id), activity);
      void queryClient.invalidateQueries();
    },
  });
}
