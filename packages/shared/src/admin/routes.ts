import { z } from 'zod';
import type { RouteDef } from '../api/routes';
import { emailStartInputSchema, emailVerifyInputSchema } from '../schemas/auth';
import { emptyInputSchema, idSchema, okSchema } from '../schemas/common';
import {
  adminActivityDetailSchema,
  adminActivityListQuerySchema,
  adminActivityRowSchema,
  adminMessageSchema,
  adminReportDetailSchema,
  adminReportListQuerySchema,
  adminReportSchema,
  adminStatsSchema,
  adminUserDetailSchema,
  adminUserListQuerySchema,
  adminUserRowSchema,
  auditEntrySchema,
  auditQuerySchema,
  cancelActivityInputSchema,
  moderateUserInputSchema,
  pageOf,
  pageQuerySchema,
  resolveReportInputSchema,
  staffSchema,
  statsQuerySchema,
  type StaffRole,
} from './schemas';

// Routes de l'admin. auth : session admin (cookie) requise. role : rôle minimal exigé.
export interface AdminRouteDef<
  I extends z.ZodType = z.ZodType,
  O extends z.ZodType = z.ZodType,
> extends RouteDef<I, O> {
  role?: StaffRole;
}

const route = <I extends z.ZodType, O extends z.ZodType>(def: AdminRouteDef<I, O>) => def;
const byId = z.object({ id: idSchema });

export const adminRoutes = {
  'admin.auth.start': route({
    method: 'POST',
    path: '/admin/auth/start',
    auth: false,
    input: emailStartInputSchema,
    output: okSchema,
  }),
  'admin.auth.verify': route({
    method: 'POST',
    path: '/admin/auth/verify',
    auth: false,
    input: emailVerifyInputSchema,
    output: staffSchema,
  }),
  'admin.auth.logout': route({
    method: 'POST',
    path: '/admin/auth/logout',
    auth: true,
    input: emptyInputSchema,
    output: okSchema,
  }),
  'admin.me': route({
    method: 'GET',
    path: '/admin/me',
    auth: true,
    input: emptyInputSchema,
    output: staffSchema,
  }),

  'admin.stats': route({
    method: 'GET',
    path: '/admin/stats',
    auth: true,
    input: statsQuerySchema,
    output: adminStatsSchema,
  }),

  'admin.reports.list': route({
    method: 'GET',
    path: '/admin/reports',
    auth: true,
    input: adminReportListQuerySchema,
    output: pageOf(adminReportSchema),
  }),
  'admin.reports.get': route({
    method: 'GET',
    path: '/admin/reports/:id',
    auth: true,
    input: byId,
    output: adminReportDetailSchema,
  }),
  // Clôt aussi les autres signalements ouverts sur la même cible (même affaire).
  'admin.reports.resolve': route({
    method: 'POST',
    path: '/admin/reports/:id/resolve',
    auth: true,
    input: resolveReportInputSchema,
    output: z.object({ updated: z.number().int().nonnegative() }),
  }),

  'admin.users.list': route({
    method: 'GET',
    path: '/admin/users',
    auth: true,
    input: adminUserListQuerySchema,
    output: pageOf(adminUserRowSchema),
  }),
  'admin.users.get': route({
    method: 'GET',
    path: '/admin/users/:id',
    auth: true,
    input: byId,
    output: adminUserDetailSchema,
  }),
  'admin.users.moderate': route({
    method: 'POST',
    path: '/admin/users/:id/moderation',
    auth: true,
    input: moderateUserInputSchema,
    output: adminUserDetailSchema,
  }),

  'admin.activities.list': route({
    method: 'GET',
    path: '/admin/activities',
    auth: true,
    input: adminActivityListQuerySchema,
    output: pageOf(adminActivityRowSchema),
  }),
  'admin.activities.get': route({
    method: 'GET',
    path: '/admin/activities/:id',
    auth: true,
    input: byId,
    output: adminActivityDetailSchema,
  }),
  // Lecture du chat de groupe : chaque consultation est inscrite au journal de l'équipe.
  'admin.activities.messages': route({
    method: 'GET',
    path: '/admin/activities/:id/messages',
    auth: true,
    input: byId.extend(pageQuerySchema.shape),
    output: pageOf(adminMessageSchema),
  }),
  'admin.activities.cancel': route({
    method: 'POST',
    path: '/admin/activities/:id/cancel',
    auth: true,
    input: cancelActivityInputSchema,
    output: adminActivityDetailSchema,
  }),

  // Journal de l'équipe : décisions, lectures de conversations, connexions.
  'admin.audit.list': route({
    method: 'GET',
    path: '/admin/audit',
    auth: true,
    role: 'admin',
    input: auditQuerySchema,
    output: pageOf(auditEntrySchema),
  }),
} as const;

export type AdminRouteName = keyof typeof adminRoutes;
export type AdminRouteInput<R extends AdminRouteName> = z.input<(typeof adminRoutes)[R]['input']>;
export type AdminRouteParsedInput<R extends AdminRouteName> = z.output<
  (typeof adminRoutes)[R]['input']
>;
export type AdminRouteOutput<R extends AdminRouteName> = z.output<
  (typeof adminRoutes)[R]['output']
>;
