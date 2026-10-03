import type { MyActivitiesScope } from '@lokky/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listMyActivities } from '../api';
import { activityKeys } from '../queryKeys';

export function useMyActivities(scope: MyActivitiesScope) {
  const result = useInfiniteQuery({
    queryKey: activityKeys.mine(scope),
    queryFn: ({ pageParam }) => listMyActivities(scope, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  return { ...result, activities: result.data?.pages.flatMap((p) => p.items) ?? [] };
}
