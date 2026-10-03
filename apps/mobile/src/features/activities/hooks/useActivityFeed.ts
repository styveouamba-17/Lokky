import type { ActivityListQuery } from '@lokky/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listActivities } from '../api';
import { activityKeys } from '../queryKeys';

// Fil Découvrir, paginé par curseur (spec §7.1).
export function useActivityFeed(
  query: Omit<ActivityListQuery, 'cursor'>,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const result = useInfiniteQuery({
    queryKey: activityKeys.feed(query),
    queryFn: ({ pageParam }) => listActivities({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
  return { ...result, activities: result.data?.pages.flatMap((p) => p.items) ?? [] };
}
