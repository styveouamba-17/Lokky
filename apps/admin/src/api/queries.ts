import type { AdminRouteInput, AdminRouteName } from '@lokky/shared/admin';
import {
  keepPreviousData,
  QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api, ApiError } from './client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      // Une session expirée ne se corrige pas en réessayant.
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

// Clé de cache = nom de route + entrée : une page, un filtre, une fiche.
const query = <R extends AdminRouteName>(name: R, input: AdminRouteInput<R>) =>
  queryOptions({ queryKey: [name, input], queryFn: () => api(name, input) });

export const meQuery = () => query('admin.me', {});

export const useStats = (days: number) => useQuery(query('admin.stats', { days }));
export const useOpenReportCount = () =>
  useQuery({
    ...query('admin.reports.list', { status: 'open', pageSize: 1 }),
    select: (page) => page.total,
  });

export const useReports = (input: AdminRouteInput<'admin.reports.list'>) =>
  useQuery({ ...query('admin.reports.list', input), placeholderData: keepPreviousData });
export const useReport = (id: string | undefined) =>
  useQuery({ ...query('admin.reports.get', { id: id ?? '' }), enabled: Boolean(id) });

export const useUsers = (input: AdminRouteInput<'admin.users.list'>) =>
  useQuery({ ...query('admin.users.list', input), placeholderData: keepPreviousData });
export const useUser = (id: string) => useQuery(query('admin.users.get', { id }));

export const useActivities = (input: AdminRouteInput<'admin.activities.list'>) =>
  useQuery({ ...query('admin.activities.list', input), placeholderData: keepPreviousData });
export const useActivity = (id: string) => useQuery(query('admin.activities.get', { id }));
export const useActivityMessages = (id: string, page: number, enabled: boolean) =>
  useQuery({
    ...query('admin.activities.messages', { id, page }),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useAudit = (input: AdminRouteInput<'admin.audit.list'>) =>
  useQuery({ ...query('admin.audit.list', input), placeholderData: keepPreviousData });

// Après une décision, tout ce qui peut l'afficher est rechargé (listes, fiches, compteurs).
function useAdminMutation<R extends AdminRouteName>(name: R) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminRouteInput<R>) => api(name, input),
    onSuccess: () => client.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'admin.me' }),
  });
}

export const useResolveReport = () => useAdminMutation('admin.reports.resolve');
export const useModerateUser = () => useAdminMutation('admin.users.moderate');
export const useCancelActivity = () => useAdminMutation('admin.activities.cancel');
