import type {
  ActivityListQuery,
  AttendanceInput,
  CreateActivityInput,
  MyActivitiesScope,
  ReviewInput,
  UpdateActivityInput,
} from '@lokky/shared';
import { apiClient } from '@/api/client';

export const listActivities = (query: ActivityListQuery) =>
  apiClient.request('activities.list', query);
export const getActivity = (id: string) => apiClient.request('activities.get', { id });
export const getParticipants = (id: string) => apiClient.request('activities.participants', { id });
export const joinActivity = (id: string) => apiClient.request('activities.join', { id });
export const leaveActivity = (id: string) => apiClient.request('activities.leave', { id });
export const createActivity = (input: CreateActivityInput) =>
  apiClient.request('activities.create', input);
export const updateActivity = (input: UpdateActivityInput) =>
  apiClient.request('activities.update', input);
export const cancelActivity = (id: string) => apiClient.request('activities.cancel', { id });
export const listMyActivities = (scope: MyActivitiesScope, cursor?: string) =>
  apiClient.request('activities.mine', { scope, cursor });
export const createReview = (input: ReviewInput) => apiClient.request('reviews.create', input);
export const declareAttendance = (input: AttendanceInput) =>
  apiClient.request('activities.attendance', input);
