import { z } from 'zod';
import { ACTIVITY_STATUSES, USER_STATUSES } from '../constants';
import { categorySchema, idSchema, isoDateTimeSchema, neighborhoodSchema } from '../schemas/common';
import { reportReasonSchema } from '../schemas/safety';
import { moderationStatusSchema, trustStatsSchema, userPreviewSchema } from '../schemas/user';

// Contrat de l'admin de modération (apps/admin ↔ apps/api, routes /admin/*). Séparé du
// contrat de l'app mobile : l'app n'en a jamais besoin (import « @lokky/shared/admin »).

// ── Équipe ──────────────────────────────────────────────────────────────────────────────
// moderator : signalements, avertir, suspendre, rétablir, annuler une sortie.
// admin : en plus, bannir et lever un bannissement.
export const STAFF_ROLES = ['moderator', 'admin'] as const;
export const staffRoleSchema = z.enum(STAFF_ROLES);

export const staffSchema = z.object({
  id: idSchema,
  email: z.email(),
  firstName: z.string().nullable(),
  role: staffRoleSchema,
});

// ── Pagination par pages (tableaux de l'admin : total et numéro de page) ─────────────────
export const ADMIN_PAGE_SIZE = 25;

export const pageQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

export function pageOf<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });
}

// ── Comptes ─────────────────────────────────────────────────────────────────────────────
const moderationStateSchema = z.object({
  status: moderationStatusSchema,
  suspendedUntil: isoDateTimeSchema.nullable(),
});

const staffRefSchema = z.object({ id: idSchema, firstName: z.string().nullable() });

export const adminUserRowSchema = z.object({
  id: idSchema,
  email: z.string(),
  firstName: z.string().nullable(),
  avatarUrl: z.url().nullable(),
  moderation: moderationStateSchema,
  role: staffRoleSchema.nullable(),
  createdAt: isoDateTimeSchema,
  onboardedAt: isoDateTimeSchema.nullable(),
  deletedAt: isoDateTimeSchema.nullable(),
  // Signalements encore ouverts qui visent ce compte (directement ou via ses messages, sorties).
  openReports: z.number().int().nonnegative(),
});

export const ADMIN_USER_FILTERS = [
  'all',
  'active',
  'warned',
  'suspended',
  'banned',
  'deleted',
] as const;

export const adminUserListQuerySchema = pageQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  filter: z.enum(ADMIN_USER_FILTERS).optional(),
});

export const moderationEventSchema = z.object({
  id: idSchema,
  status: moderationStatusSchema,
  until: isoDateTimeSchema.nullable(),
  reason: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  // null : décision prise en ligne de commande (npm run moderate).
  actor: staffRefSchema.nullable(),
});

export const adminActivityRowSchema = z.object({
  id: idSchema,
  title: z.string(),
  category: categorySchema,
  startsAt: isoDateTimeSchema,
  placeName: z.string(),
  neighborhood: neighborhoodSchema.nullable(),
  capacity: z.number().int(),
  participantCount: z.number().int().nonnegative(),
  creator: userPreviewSchema,
  status: z.enum(ACTIVITY_STATUSES),
  cancelledAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  openReports: z.number().int().nonnegative(),
});

// ── Signalements ────────────────────────────────────────────────────────────────────────
export const REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;
export const reportStatusSchema = z.enum(REPORT_STATUSES);
export const REPORT_TARGET_TYPES = ['user', 'activity', 'message'] as const;

// Ce que vise le signalement, tel qu'il est aujourd'hui (null : supprimé depuis).
export const reportTargetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user'),
    id: idSchema,
    user: z
      .object({
        id: idSchema,
        firstName: z.string().nullable(),
        avatarUrl: z.url().nullable(),
        moderation: moderationStateSchema,
      })
      .nullable(),
  }),
  z.object({
    type: z.literal('activity'),
    id: idSchema,
    activity: z
      .object({
        id: idSchema,
        title: z.string(),
        startsAt: isoDateTimeSchema,
        cancelledAt: isoDateTimeSchema.nullable(),
        creator: userPreviewSchema,
      })
      .nullable(),
  }),
  z.object({
    type: z.literal('message'),
    id: idSchema,
    message: z
      .object({
        id: idSchema,
        body: z.string(),
        createdAt: isoDateTimeSchema,
        sender: userPreviewSchema.nullable(),
        conversationId: idSchema,
        conversationType: z.enum(['group', 'direct']),
        activity: z.object({ id: idSchema, title: z.string() }).nullable(),
      })
      .nullable(),
  }),
]);

export const adminReportSchema = z.object({
  id: idSchema,
  reason: reportReasonSchema,
  details: z.string().nullable(),
  status: reportStatusSchema,
  createdAt: isoDateTimeSchema,
  reporter: userPreviewSchema.nullable(),
  target: reportTargetSchema,
  handledAt: isoDateTimeSchema.nullable(),
  handledBy: staffRefSchema.nullable(),
  note: z.string().nullable(),
  // Signalements ouverts sur la même cible (celui-ci compris) : plusieurs personnes = urgent.
  sameTargetOpen: z.number().int().nonnegative(),
});

export const adminReportListQuerySchema = pageQuerySchema.extend({
  status: reportStatusSchema.optional(),
  targetType: z.enum(REPORT_TARGET_TYPES).optional(),
});

export const adminMessageSchema = z.object({
  id: idSchema,
  sender: userPreviewSchema.nullable(),
  type: z.enum(['text', 'system']),
  body: z.string(),
  createdAt: isoDateTimeSchema,
});

export const adminReportDetailSchema = adminReportSchema.extend({
  // Message signalé : les messages autour, pour juger dans son contexte.
  context: z.array(adminMessageSchema),
  // Compte concerné (la personne, l'auteur du message, le créateur de la sortie).
  concernedUser: adminUserRowSchema.nullable(),
  concernedHistory: z.array(moderationEventSchema),
  // Les autres signalements sur la même cible, tous statuts confondus.
  related: z.array(adminReportSchema),
});

export const NOTE_MAX = 500;

export const resolveReportInputSchema = z.object({
  id: idSchema,
  status: z.enum(['resolved', 'dismissed']),
  note: z.string().trim().max(NOTE_MAX).optional(),
});

// ── Fiches détaillées ───────────────────────────────────────────────────────────────────
export const adminUserDetailSchema = adminUserRowSchema.extend({
  birthDate: z.iso.date().nullable(),
  status: z.enum(USER_STATUSES).nullable(),
  neighborhood: neighborhoodSchema.nullable(),
  interests: z.array(categorySchema),
  providers: z.array(z.enum(['apple', 'google'])),
  trust: trustStatsSchema,
  history: z.array(moderationEventSchema),
  reportsReceived: z.array(adminReportSchema),
  reportsMade: z.number().int().nonnegative(),
  activities: z.array(adminActivityRowSchema.extend({ role: z.enum(['creator', 'participant']) })),
});

export const MODERATION_REASON_MIN = 3;
export const SUSPENSION_DAYS_MAX = 365;

export const moderateUserInputSchema = z
  .object({
    id: idSchema,
    status: moderationStatusSchema,
    // Suspension : durée en jours (obligatoire).
    days: z.number().int().min(1).max(SUSPENSION_DAYS_MAX).optional(),
    reason: z.string().trim().min(MODERATION_REASON_MIN).max(NOTE_MAX),
  })
  .refine((v) => v.status !== 'suspended' || v.days !== undefined, {
    message: 'Durée de suspension requise.',
    path: ['days'],
  });

export const adminParticipantSchema = userPreviewSchema.extend({
  joinedAt: isoDateTimeSchema,
  attended: z.boolean().nullable(),
  isCreator: z.boolean(),
});

export const adminActivityDetailSchema = adminActivityRowSchema.extend({
  description: z.string(),
  meetingPoint: z.string().nullable(),
  costType: z.enum(['free', 'split']),
  costEstimateFcfa: z.number().int().nullable(),
  lat: z.number(),
  lng: z.number(),
  conversationId: idSchema.nullable(),
  messageCount: z.number().int().nonnegative(),
  participants: z.array(adminParticipantSchema),
  reports: z.array(adminReportSchema),
});

export const ADMIN_ACTIVITY_FILTERS = ['all', 'upcoming', 'past', 'cancelled'] as const;

export const adminActivityListQuerySchema = pageQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  filter: z.enum(ADMIN_ACTIVITY_FILTERS).optional(),
});

export const cancelActivityInputSchema = z.object({
  id: idSchema,
  reason: z.string().trim().min(MODERATION_REASON_MIN).max(NOTE_MAX),
});

// ── Statistiques ────────────────────────────────────────────────────────────────────────
export const STATS_PERIODS = [7, 30, 90] as const;

export const statsQuerySchema = z.object({
  days: z
    .number()
    .int()
    .refine((d) => (STATS_PERIODS as readonly number[]).includes(d), 'Période invalide.')
    .optional(),
});

export const adminStatsSchema = z.object({
  days: z.number().int(),
  totals: z.object({
    members: z.number().int().nonnegative(), // inscrits, profil complété, non supprimés
    newMembers: z.number().int().nonnegative(),
    activitiesUpcoming: z.number().int().nonnegative(),
    activitiesCreated: z.number().int().nonnegative(),
    joins: z.number().int().nonnegative(),
    messages: z.number().int().nonnegative(),
    openReports: z.number().int().nonnegative(),
    suspended: z.number().int().nonnegative(),
    banned: z.number().int().nonnegative(),
  }),
  // Une ligne par jour (UTC = heure de Dakar), du plus ancien au plus récent.
  series: z.array(
    z.object({
      date: z.iso.date(),
      signups: z.number().int().nonnegative(),
      activities: z.number().int().nonnegative(),
      joins: z.number().int().nonnegative(),
      reports: z.number().int().nonnegative(),
    }),
  ),
  categories: z.array(z.object({ category: categorySchema, count: z.number().int() })),
});

// ── Journal de l'équipe (administrateurs) ───────────────────────────────────────────
export const AUDIT_KINDS = ['all', 'decisions', 'reads', 'logins'] as const;

export const auditQuerySchema = pageQuerySchema.extend({
  kind: z.enum(AUDIT_KINDS).optional(),
});

export const auditEntrySchema = z.object({
  id: idSchema,
  actor: staffRefSchema.nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  // Nom lisible de la cible aujourd'hui (prénom, titre de sortie), null si introuvable.
  targetLabel: z.string().nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
  createdAt: isoDateTimeSchema,
});

export type AuditKind = (typeof AUDIT_KINDS)[number];
export type AuditEntry = z.infer<typeof auditEntrySchema>;
export type StaffRole = z.infer<typeof staffRoleSchema>;
export type Staff = z.infer<typeof staffSchema>;
export type AdminPage<T> = { items: T[]; total: number; page: number; pageSize: number };
export type AdminUserRow = z.infer<typeof adminUserRowSchema>;
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;
export type AdminUserFilter = (typeof ADMIN_USER_FILTERS)[number];
export type ModerationEvent = z.infer<typeof moderationEventSchema>;
export type AdminActivityRow = z.infer<typeof adminActivityRowSchema>;
export type AdminActivityDetail = z.infer<typeof adminActivityDetailSchema>;
export type AdminActivityFilter = (typeof ADMIN_ACTIVITY_FILTERS)[number];
export type AdminParticipant = z.infer<typeof adminParticipantSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type ReportTarget = z.infer<typeof reportTargetSchema>;
export type AdminReport = z.infer<typeof adminReportSchema>;
export type AdminReportDetail = z.infer<typeof adminReportDetailSchema>;
export type AdminMessage = z.infer<typeof adminMessageSchema>;
export type AdminStats = z.infer<typeof adminStatsSchema>;
export type ModerateUserInput = z.input<typeof moderateUserInputSchema>;
