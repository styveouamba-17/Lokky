import {
  ADMIN_ACTIVITY_FILTERS,
  AUDIT_KINDS,
  ADMIN_USER_FILTERS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  STATS_PERIODS,
} from '@lokky/shared/admin';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { z } from 'zod';
import { ApiError } from './api/client';
import { meQuery, queryClient } from './api/queries';
import { ActivitiesPage } from './features/activities/ActivitiesPage';
import { ActivityPage } from './features/activities/ActivityPage';
import { AuditPage } from './features/audit/AuditPage';
import { LoginPage } from './features/auth/LoginPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { StatsPage } from './features/stats/StatsPage';
import { UserPage } from './features/users/UserPage';
import { UsersPage } from './features/users/UsersPage';
import { Shell } from './layout/Shell';
import { ToastProvider } from './ui';
import { RouteProgress } from './ui/RouteProgress';

// Paramètres d'URL : filtres et page sont dans l'adresse (lien partageable, retour arrière).
const page = z.number().int().min(1).default(1).catch(1);
const text = z.string().max(100).optional().catch(undefined);

const rootRoute = createRootRoute({
  component: () => (
    <ToastProvider>
      <RouteProgress />
      <Outlet />
    </ToastProvider>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Toutes les autres pages exigent une session de l'équipe.
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: async () => {
    try {
      return { staff: await queryClient.ensureQueryData(meQuery()) };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw redirect({ to: '/login' });
      throw error;
    }
  },
  component: Shell,
});

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/reports' });
  },
});

export const reportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/reports',
  validateSearch: z.object({
    status: z.enum(REPORT_STATUSES).default('open').catch('open'),
    type: z.enum(REPORT_TARGET_TYPES).optional().catch(undefined),
    page,
    id: text,
  }),
  component: ReportsPage,
});

export const usersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/users',
  validateSearch: z.object({
    q: text,
    filter: z.enum(ADMIN_USER_FILTERS).default('all').catch('all'),
    page,
  }),
  component: UsersPage,
});

export const userRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/users/$id',
  component: UserPage,
});

export const activitiesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/activities',
  validateSearch: z.object({
    q: text,
    filter: z.enum(ADMIN_ACTIVITY_FILTERS).default('upcoming').catch('upcoming'),
    page,
  }),
  component: ActivitiesPage,
});

export const activityRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/activities/$id',
  component: ActivityPage,
});

export const statsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/stats',
  validateSearch: z.object({
    days: z
      .number()
      .refine((d) => (STATS_PERIODS as readonly number[]).includes(d))
      .default(30)
      .catch(30),
  }),
  component: StatsPage,
});

// Journal de l'équipe : administrateurs seulement (l'API le refuse aussi aux autres).
export const auditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/audit',
  beforeLoad: ({ context }) => {
    if (context.staff.role !== 'admin') throw redirect({ to: '/reports' });
  },
  validateSearch: z.object({
    kind: z.enum(AUDIT_KINDS).default('all').catch('all'),
    page,
  }),
  component: AuditPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    indexRoute,
    reportsRoute,
    usersRoute,
    userRoute,
    activitiesRoute,
    activityRoute,
    statsRoute,
    auditRoute,
  ]),
]);

export const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
