import type { CreateActivityInput } from '@lokky/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createActivity } from '../api';
import { activityKeys } from '../queryKeys';

// Publication : la nouvelle sortie est mise en cache pour son détail, et le fil se recharge.
export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActivityInput) => createActivity(input),
    onSuccess: (activity) => {
      queryClient.setQueryData(activityKeys.detail(activity.id), activity);
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
