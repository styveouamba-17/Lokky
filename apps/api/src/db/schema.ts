import type {
  ActivityCategory,
  City,
  NeighborhoodId,
  Preferences,
  UserStatus,
} from '@lokky/shared';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  primaryKey,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Schéma Drizzle (spec backend §6). Les tables arrivent avec leurs étapes :
// B2 utilisateurs et sessions, B3 sorties, B4 chat, B5 confiance et sécurité, B6 push.
// Les extensions (PostGIS, citext) sont créées par la migration 0000_extensions.sql.

// Texte comparé sans tenir compte de la casse (extension citext) : emails.
const citext = customType<{ data: string }>({ dataType: () => 'citext' });

// Point géographique PostGIS (mètres, sphère terrestre) : recherche par distance.
const geography = customType<{ data: string }>({ dataType: () => 'geography(Point, 4326)' });

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
};

// ── B2 : utilisateurs et authentification ───────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: citext('email').notNull().unique(),
  // Profil : vide jusqu'à la fin de l'onboarding (onboarded_at).
  firstName: text('first_name'),
  birthDate: date('birth_date'),
  status: text('status').$type<UserStatus>(),
  neighborhood: text('neighborhood').$type<NeighborhoodId>(),
  interests: text('interests')
    .array()
    .$type<ActivityCategory[]>()
    .notNull()
    .default(sql`'{}'`),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').$type<Preferences>(),
  moderationStatus: text('moderation_status')
    .$type<'active' | 'warned' | 'suspended' | 'banned'>()
    .notNull()
    .default('active'),
  suspendedUntil: timestamp('suspended_until', { withTimezone: true }),
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

// Connexion Apple ou Google rattachée à un compte (un compte peut en avoir plusieurs).
export const authIdentities = pgTable(
  'auth_identities',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').$type<'apple' | 'google'>().notNull(),
    subject: text('subject').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('auth_identities_provider_subject').on(t.provider, t.subject)],
);

// Codes de connexion par email : hachés, 10 minutes, 5 essais (spec backend §5).
export const emailCodes = pgTable(
  'email_codes',
  {
    id: uuid('id').primaryKey(),
    email: citext('email').notNull(),
    codeHash: text('code_hash').notNull(),
    attempts: integer('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index('email_codes_email').on(t.email, t.createdAt)],
);

// Refresh tokens : hachés, rotation à chaque usage. Une même connexion forme une « famille » :
// la réutilisation d'un jeton déjà échangé révoque toute la famille (vol probable).
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    familyId: uuid('family_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('sessions_family').on(t.familyId), index('sessions_user').on(t.userId)],
);

// ── B3 : sorties et participations ──────────────────────────────────────────────────────

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey(),
    title: text('title').notNull(),
    category: text('category').$type<ActivityCategory>().notNull(),
    description: text('description').notNull().default(''),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    placeName: text('place_name').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    // Calculé par PostgreSQL à partir de lat / lng : jamais écrit par le code.
    location: geography('location').generatedAlwaysAs(
      sql`(ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)`,
    ),
    neighborhood: text('neighborhood').$type<NeighborhoodId>(),
    meetingPoint: text('meeting_point'),
    capacity: integer('capacity').notNull(),
    costType: text('cost_type').$type<'free' | 'split'>().notNull(),
    costEstimateFcfa: integer('cost_estimate_fcfa'),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id),
    city: text('city').$type<City>().notNull().default('dakar'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    check('activities_capacity', sql`${t.capacity} between 2 and 20`),
    index('activities_starts_at').on(t.startsAt),
    index('activities_creator').on(t.creatorId),
    index('activities_location').using('gist', t.location),
  ],
);

// Le créateur est le premier participant. attended : présence déclarée par le créateur
// après la sortie (null tant qu'elle ne l'est pas).
export const participations = pgTable(
  'participations',
  {
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    attended: boolean('attended'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.activityId, t.userId] }),
    index('participations_user').on(t.userId),
  ],
);

// ── B3 / B4 : conversations ──────────────────────────────────────────────────────────────
// Le groupe d'une sortie est créé avec elle (B3) ; les messages arrivent en B4.

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey(),
    type: text('type').$type<'group' | 'direct'>().notNull(),
    // Groupe : la sortie (une seule conversation par sortie).
    activityId: uuid('activity_id').references(() => activities.id, { onDelete: 'cascade' }),
    // Privé : « idA:idB » trié, pour garantir une seule conversation par paire.
    directKey: text('direct_key'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('conversations_activity').on(t.activityId),
    uniqueIndex('conversations_direct_key').on(t.directKey),
    check(
      'conversations_kind',
      sql`(${t.type} = 'group' and ${t.activityId} is not null and ${t.directKey} is null)
        or (${t.type} = 'direct' and ${t.activityId} is null and ${t.directKey} is not null)`,
    ),
  ],
);

export const conversationMembers = pgTable(
  'conversation_members',
  {
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Dernière lecture : sert aux non-lus (B4).
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index('conversation_members_user').on(t.userId),
  ],
);

// ── B4 : messages ────────────────────────────────────────────────────────────────────────

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    // null : message système (« Awa a rejoint le groupe ») ou auteur supprimé.
    senderId: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
    type: text('type').$type<'text' | 'system'>().notNull(),
    body: text('body').notNull(),
    // Identifiant choisi par l'app : un message renvoyé après une coupure n'est pas dupliqué.
    clientId: text('client_id'),
    ...timestamps,
  },
  (t) => [
    index('messages_conversation_created').on(t.conversationId, t.createdAt),
    uniqueIndex('messages_client_id')
      .on(t.conversationId, t.senderId, t.clientId)
      .where(sql`${t.clientId} is not null`),
  ],
);

// ── B5 : confiance et sécurité ──────────────────────────────────────────────────────────

// Avis d'un participant sur le créateur, une fois par sortie.
export const reviews = pgTable(
  'reviews',
  {
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.activityId, t.authorId] }),
    check('reviews_rating', sql`${t.rating} between 1 and 5`),
  ],
);

export const blocks = pgTable(
  'blocks',
  {
    blockerId: uuid('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.blockerId, t.blockedId] }),
    index('blocks_blocked').on(t.blockedId),
  ],
);

// Signalements : traités par l'équipe dans l'admin (spec séparée).
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey(),
    reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'set null' }),
    targetType: text('target_type').$type<'user' | 'activity' | 'message'>().notNull(),
    targetId: text('target_id').notNull(),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status').$type<'open' | 'resolved' | 'dismissed'>().notNull().default('open'),
    ...timestamps,
  },
  (t) => [index('reports_status').on(t.status, t.createdAt)],
);

// Historique des décisions de modération (avertir, suspendre, bannir, rétablir).
export const moderationEvents = pgTable('moderation_events', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').$type<'active' | 'warned' | 'suspended' | 'banned'>().notNull(),
  until: timestamp('until', { withTimezone: true }),
  reason: text('reason'),
  ...timestamps,
});

// ── B6 : notifications push ─────────────────────────────────────────────────────────────

// Jetons Expo des téléphones. Un jeton suit le dernier compte connecté sur ce téléphone.
export const pushTokens = pgTable(
  'push_tokens',
  {
    token: text('token').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: text('platform').$type<'ios' | 'android'>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('push_tokens_user').on(t.userId)],
);
