import { useQuery } from '@tanstack/react-query';
import { getActivity, getParticipants } from '../api';
import { activityKeys } from '../queryKeys';

export const useActivity = (id: string) =>
  useQuery({ queryKey: activityKeys.detail(id), queryFn: () => getActivity(id) });

export const useParticipants = (id: string) =>
  useQuery({ queryKey: activityKeys.participants(id), queryFn: () => getParticipants(id) });
