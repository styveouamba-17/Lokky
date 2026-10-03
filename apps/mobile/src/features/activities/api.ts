import type { ActivityListQuery, CreateActivityInput } from '@lokky/shared';
import { apiClient } from '@/api/client';

export const listActivities = (query: ActivityListQuery) =>
  apiClient.request('activities.list', query);
export const getActivity = (id: string) => apiClient.request('activities.get', { id });
export const getParticipants = (id: string) => apiClient.request('activities.participants', { id });
export const joinActivity = (id: string) => apiClient.request('activities.join', { id });
export const leaveActivity = (id: string) => apiClient.request('activities.leave', { id });
export const createActivity = (input: CreateActivityInput) =>
  apiClient.request('activities.create', input);
