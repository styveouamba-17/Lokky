import type { AttendanceInput, ReviewInput } from '@lokky/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview, declareAttendance } from '../api';
import { activityKeys } from '../queryKeys';

// Après une sortie : avis du participant, présence déclarée par le créateur. Les deux changent
// viewerState (plus de bouton) et les statistiques de confiance : on resynchronise tout.

export function useReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => createReview(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: activityKeys.all }),
  });
}

export function useAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceInput) => declareAttendance(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: activityKeys.all }),
  });
}
