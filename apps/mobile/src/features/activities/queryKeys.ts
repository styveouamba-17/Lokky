import type { ActivityListQuery, MyActivitiesScope } from '@lokky/shared';

export const activityKeys = {
  all: ['activities'] as const,
  feed: (query: Omit<ActivityListQuery, 'cursor'>) => ['activities', 'feed', query] as const,
  detail: (id: string) => ['activities', 'detail', id] as const,
  participants: (id: string) => ['activities', 'participants', id] as const,
  mine: (scope: MyActivitiesScope) => ['activities', 'mine', scope] as const,
};
