import type { ReportInput } from '@lokky/shared';
import { apiClient } from '@/api/client';

export const getMe = () => apiClient.request('me.get', {});
export const createReport = (input: ReportInput) => apiClient.request('reports.create', input);
