import { LIMITS, type Activity, type UserPreview } from '@lokky/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinActivity, leaveActivity } from '../api';
import { activityKeys } from '../queryKeys';

// « Je viens ! » / « Je ne viens plus » optimistes (spec §7.2) : le détail change tout de
// suite, on revient en arrière si le serveur refuse, puis on resynchronise les listes.
function applyOptimistic(activity: Activity, joining: boolean, me: UserPreview): Activity {
  const delta = joining ? 1 : -1;
  return {
    ...activity,
    participantCount: activity.participantCount + delta,
    participantsPreview: joining
      ? [me, ...activity.participantsPreview].slice(0, LIMITS.activity.participantsPreviewMax)
      : activity.participantsPreview.filter((p) => p.id !== me.id),
    viewerState: {
      ...activity.viewerState,
      isParticipant: joining,
      canJoin: !joining,
      canLeave: joining && !activity.viewerState.isCreator,
    },
  };
}

export function useParticipation(id: string, me: UserPreview) {
  const queryClient = useQueryClient();
  const key = activityKeys.detail(id);

  return useMutation({
    mutationFn: (joining: boolean) => (joining ? joinActivity(id) : leaveActivity(id)),
    onMutate: async (joining) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Activity>(key);
      if (previous) queryClient.setQueryData(key, applyOptimistic(previous, joining, me));
      return { previous };
    },
    onError: (_error, _joining, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (activity) => queryClient.setQueryData(key, activity),
    onSettled: (_activity, _error, joining) => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
      if (!joining) void queryClient.invalidateQueries();
    },
  });
}
