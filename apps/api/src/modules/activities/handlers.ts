import {
  ACTIVITY_ONGOING_HOURS,
  getWhenRange,
  LIMITS,
  type ActivityListQuery,
  type Paginated,
} from '@lokky/shared';
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { Database } from '../../db/client';
import { activities, participations } from '../../db/schema';
import { viewer, type HandlerContext, type Handlers } from '../../http/context';
import { HttpError } from '../../http/errors';
import { decodeCursor, encodeCursor, isOffset } from '../../lib/cursor';
import { uuidv7 } from '../../lib/ids';
import { addGroupMember, createGroup, removeGroupMember } from '../chat/groups';
import { cutOffIds } from '../safety/blocks';
import { findUser, isOnboarded, toPublicUser } from '../users/users';
import { trustFor } from '../trust/stats';
import { statusOf, toActivities, type ActivityRow } from './views';

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
const DAY_MS = 24 * HOUR_MS;
const pageSize = (limit?: number) => limit ?? LIMITS.pagination.defaultLimit;

// Une sortie « à venir ou en cours » : pas annulée et pas encore terminée (début + 3 h).
const notEndedSince = (now: Date) => new Date(now.getTime() - ACTIVITY_ONGOING_HOURS * HOUR_MS);

// Écrire (créer, rejoindre…) demande un profil complet.
async function member(ctx: HandlerContext) {
  const row = await findUser(ctx.db, viewer(ctx));
  if (!row || row.deletedAt) throw new HttpError('unauthorized', 'Compte introuvable.');
  if (!isOnboarded(row)) throw new HttpError('onboarding_required', 'Profil à compléter.');
  return row;
}

// Un créneau : au moins 15 minutes à l'avance, au plus 60 jours.
function assertSlot(starts: Date, now: Date) {
  if (
    starts.getTime() < now.getTime() + LIMITS.activity.minLeadMinutes * MINUTE_MS ||
    starts.getTime() > now.getTime() + LIMITS.activity.maxAheadDays * DAY_MS
  ) {
    throw new HttpError('validation', 'startsAt : créneau hors des limites.');
  }
}

export async function activitiesByIds(
  db: Database,
  ids: readonly string[],
): Promise<Map<string, ActivityRow>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select()
    .from(activities)
    .where(inArray(activities.id, [...ids]));
  return new Map(rows.map((r) => [r.id, r]));
}

export async function participantIdsOf(db: Database, activityId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: participations.userId })
    .from(participations)
    .where(eq(participations.activityId, activityId));
  return rows.map((r) => r.userId);
}

export async function findActivity(db: Database, id: string): Promise<ActivityRow> {
  const [row] = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  if (!row) throw new HttpError('not_found', 'Activité introuvable.');
  return row;
}

// Une sortie d'une personne avec qui le lien est coupé (blocage) n'existe pas pour moi.
async function visibleActivity(ctx: HandlerContext, id: string) {
  const row = await findActivity(ctx.db, id);
  if (row.creatorId !== viewer(ctx) && (await cutOffIds(ctx.db, viewer(ctx))).has(row.creatorId)) {
    throw new HttpError('not_found', 'Activité introuvable.');
  }
  return row;
}

async function view(ctx: HandlerContext, id: string) {
  const [activity] = await toActivities(ctx.db, [await findActivity(ctx.db, id)], {
    viewerId: viewer(ctx),
    now: ctx.now(),
  });
  return activity!;
}

// Deux personnes ont participé à une même sortie passée (messages privés, spec §6.3 règle 4).
export async function sharedPastActivity(db: Database, a: string, b: string, now: Date) {
  const [row] = await db
    .select({ n: count() })
    .from(participations)
    .innerJoin(activities, eq(activities.id, participations.activityId))
    .where(
      and(
        eq(participations.userId, a),
        isNull(activities.cancelledAt),
        lte(activities.startsAt, notEndedSince(now)),
        sql`exists (select 1 from ${participations} p2
          where p2.activity_id = ${activities.id} and p2.user_id = ${b})`,
      ),
    );
  return (row?.n ?? 0) > 0;
}

// Prochaines sorties organisées par quelqu'un (profil public, spec backend §7 règle 8).
export async function organizedUpcoming(
  ctx: HandlerContext,
  creatorId: string,
  cursor: string | undefined,
  limit: number | undefined,
) {
  const offset = decodeCursor(cursor, isOffset) ?? 0;
  const size = pageSize(limit);
  const rows = await ctx.db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.creatorId, creatorId),
        isNull(activities.cancelledAt),
        gte(activities.startsAt, ctx.now()),
      ),
    )
    .orderBy(asc(activities.startsAt), asc(activities.id))
    .limit(size + 1)
    .offset(offset);
  return offsetPage(ctx, rows, offset, size);
}

async function offsetPage(
  ctx: HandlerContext,
  rows: ActivityRow[],
  offset: number,
  size: number,
): Promise<Paginated<Awaited<ReturnType<typeof toActivities>>[number]>> {
  const items = await toActivities(ctx.db, rows.slice(0, size), {
    viewerId: viewer(ctx),
    now: ctx.now(),
  });
  return { items, nextCursor: rows.length > size ? encodeCursor(offset + size) : null };
}

type FeedCursor = [string, string]; // [startsAt ISO, id]
const isFeedCursor = (v: unknown): v is FeedCursor =>
  Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'string');

async function feed(query: ActivityListQuery, ctx: HandlerContext) {
  const now = ctx.now();
  const { from, to } = getWhenRange(query.when ?? 'all', now);
  const size = pageSize(query.limit);
  const after = decodeCursor(query.cursor, isFeedCursor);
  const point =
    query.lat !== undefined && query.lng !== undefined
      ? sql`ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography`
      : null;
  const radiusKm = query.radiusKm ?? LIMITS.activity.defaultRadiusKm;
  const hidden = [...(await cutOffIds(ctx.db, viewer(ctx)))];

  const conditions: (SQL | undefined)[] = [
    isNull(activities.cancelledAt),
    gte(activities.startsAt, from),
    to ? lte(activities.startsAt, to) : undefined,
    query.categories?.length ? inArray(activities.category, query.categories) : undefined,
    query.freeOnly ? eq(activities.costType, 'free') : undefined,
    hidden.length ? notInArray(activities.creatorId, hidden) : undefined,
    point ? sql`ST_DWithin(${activities.location}, ${point}, ${radiusKm * 1000})` : undefined,
    after
      ? sql`(${activities.startsAt}, ${activities.id}) > (${after[0]}::timestamptz, ${after[1]}::uuid)`
      : undefined,
  ];

  const rows = await ctx.db
    .select({
      ...getTableColumns(activities),
      distanceKm: point
        ? sql<number>`ST_Distance(${activities.location}, ${point}) / 1000`.mapWith(Number)
        : sql<null>`null`,
    })
    .from(activities)
    .where(and(...conditions))
    .orderBy(asc(activities.startsAt), asc(activities.id))
    .limit(size + 1);

  const page = rows.slice(0, size);
  const distances = new Map(
    page.flatMap((r) => (r.distanceKm === null ? [] : [[r.id, r.distanceKm] as const])),
  );
  const items = await toActivities(ctx.db, page, { viewerId: viewer(ctx), now, distances });
  const last = page.at(-1);
  return {
    items,
    nextCursor:
      rows.length > size && last ? encodeCursor([last.startsAt.toISOString(), last.id]) : null,
  };
}

export const activitiesHandlers: Handlers = {
  'activities.list': (query, ctx) => feed(query, ctx),

  'activities.get': async ({ id }, ctx) => {
    await visibleActivity(ctx, id);
    return view(ctx, id);
  },

  'activities.participants': async ({ id }, ctx) => {
    await visibleActivity(ctx, id);
    const rows = await ctx.db
      .select({ userId: participations.userId })
      .from(participations)
      .where(eq(participations.activityId, id))
      .orderBy(asc(participations.joinedAt));
    const ids = rows.map((r) => r.userId);
    const [people, trust] = await Promise.all([
      Promise.all(ids.map((uid) => findUser(ctx.db, uid))),
      trustFor(ctx.db, ids, ctx.now()),
    ]);
    return people.flatMap((p) => (p && isOnboarded(p) ? [toPublicUser(p, trust.get(p.id)!)] : []));
  },

  // Le créateur est le premier participant, et le groupe de la sortie est créé avec elle.
  'activities.create': async (input, ctx) => {
    const me = await member(ctx);
    const now = ctx.now();
    const starts = new Date(input.startsAt);
    assertSlot(starts, now);
    const id = uuidv7(now.getTime());
    await ctx.db.transaction(async (tx) => {
      await tx.insert(activities).values({
        id,
        title: input.title,
        category: input.category,
        description: input.description,
        startsAt: starts,
        placeName: input.location.name,
        lat: input.location.coordinates.lat,
        lng: input.location.coordinates.lng,
        neighborhood: input.location.neighborhood,
        meetingPoint: input.location.meetingPoint,
        capacity: input.capacity,
        costType: input.cost.type,
        costEstimateFcfa: input.cost.type === 'split' ? (input.cost.estimateFcfa ?? null) : null,
        creatorId: me.id,
        createdAt: now,
      });
      await tx.insert(participations).values({ activityId: id, userId: me.id, joinedAt: now });
      await createGroup(tx, id, me.id, now);
    });
    await ctx.events.emit('activity.created', { activityId: id, at: now });
    return view(ctx, id);
  },

  // Modification complète tant que personne n'a rejoint, puis seulement la description et le
  // point de RDV (spec app §6.3, règle 3).
  'activities.update': async ({ id, ...changes }, ctx) => {
    const me = await member(ctx);
    const row = await findActivity(ctx.db, id);
    if (row.creatorId !== me.id) throw new HttpError('forbidden', 'Seul le créateur modifie.');
    if (statusOf(row, ctx.now()) !== 'upcoming') {
      throw new HttpError('activity_started', 'La sortie a déjà commencé.');
    }
    const [{ n: joined } = { n: 1 }] = await ctx.db
      .select({ n: count() })
      .from(participations)
      .where(eq(participations.activityId, id));

    const loc = changes.location;
    const locationMoved =
      loc !== undefined &&
      (loc.name !== row.placeName ||
        loc.coordinates.lat !== row.lat ||
        loc.coordinates.lng !== row.lng ||
        loc.neighborhood !== row.neighborhood);
    const restricted =
      changes.title !== undefined ||
      changes.startsAt !== undefined ||
      changes.capacity !== undefined ||
      changes.cost !== undefined ||
      locationMoved;
    if (joined > 1 && restricted) {
      throw new HttpError(
        'forbidden',
        'Des participants ont rejoint : seuls la description et le point de RDV changent.',
      );
    }
    if (changes.startsAt !== undefined) assertSlot(new Date(changes.startsAt), ctx.now());
    if (changes.capacity !== undefined && changes.capacity < joined) {
      throw new HttpError('validation', 'capacity : moins de places que de participants.');
    }

    await ctx.db
      .update(activities)
      .set({
        ...(changes.title !== undefined && { title: changes.title }),
        ...(changes.description !== undefined && { description: changes.description }),
        ...(changes.startsAt !== undefined && { startsAt: new Date(changes.startsAt) }),
        ...(changes.capacity !== undefined && { capacity: changes.capacity }),
        ...(changes.cost !== undefined && {
          costType: changes.cost.type,
          costEstimateFcfa:
            changes.cost.type === 'split' ? (changes.cost.estimateFcfa ?? null) : null,
        }),
        ...(loc !== undefined && {
          placeName: loc.name,
          lat: loc.coordinates.lat,
          lng: loc.coordinates.lng,
          neighborhood: loc.neighborhood,
          meetingPoint: loc.meetingPoint,
        }),
      })
      .where(eq(activities.id, id));
    await ctx.events.emit('activity.updated', { activityId: id, at: ctx.now() });
    return view(ctx, id);
  },

  'activities.cancel': async ({ id }, ctx) => {
    const me = await member(ctx);
    const row = await findActivity(ctx.db, id);
    if (row.creatorId !== me.id) throw new HttpError('forbidden', 'Seul le créateur annule.');
    if (row.cancelledAt) return view(ctx, id);
    if (statusOf(row, ctx.now()) !== 'upcoming') {
      throw new HttpError('activity_started', 'La sortie a déjà commencé.');
    }
    await ctx.db.update(activities).set({ cancelledAt: ctx.now() }).where(eq(activities.id, id));
    await ctx.events.emit('activity.cancelled', { activityId: id, at: ctx.now() });
    return view(ctx, id);
  },

  // Verrou sur la sortie : deux « Je viens ! » simultanés sur la dernière place ne passent
  // pas tous les deux (spec backend §6).
  'activities.join': async ({ id }, ctx) => {
    const me = await member(ctx);
    await visibleActivity(ctx, id);
    const now = ctx.now();
    const joined = await ctx.db.transaction(async (tx) => {
      const [row] = await tx.select().from(activities).where(eq(activities.id, id)).for('update');
      if (!row) throw new HttpError('not_found', 'Activité introuvable.');
      const [already] = await tx
        .select({ userId: participations.userId })
        .from(participations)
        .where(and(eq(participations.activityId, id), eq(participations.userId, me.id)));
      if (already) return false; // déjà inscrit : réponse identique, sans effet
      if (statusOf(row, now) !== 'upcoming') throw new HttpError('activity_started', 'Trop tard.');
      const [{ n } = { n: 0 }] = await tx
        .select({ n: count() })
        .from(participations)
        .where(eq(participations.activityId, id));
      if (n >= row.capacity) throw new HttpError('activity_full', 'Activité complète.');
      await tx.insert(participations).values({ activityId: id, userId: me.id, joinedAt: now });
      await addGroupMember(tx, id, me.id, now);
      return true;
    });
    if (joined)
      await ctx.events.emit('activity.joined', { activityId: id, userId: me.id, at: now });
    return view(ctx, id);
  },

  // On peut quitter jusqu'au début, sauf le créateur (il annule).
  'activities.leave': async ({ id }, ctx) => {
    const me = await member(ctx);
    const now = ctx.now();
    const row = await findActivity(ctx.db, id);
    const [participation] = await ctx.db
      .select({ userId: participations.userId })
      .from(participations)
      .where(and(eq(participations.activityId, id), eq(participations.userId, me.id)));
    if (!participation) throw new HttpError('not_participant', 'Tu ne participes pas.');
    if (row.creatorId === me.id || statusOf(row, now) !== 'upcoming') {
      throw new HttpError('forbidden', 'Impossible de quitter.');
    }
    await ctx.db.transaction(async (tx) => {
      await tx
        .delete(participations)
        .where(and(eq(participations.activityId, id), eq(participations.userId, me.id)));
      await removeGroupMember(tx, id, me.id);
    });
    await ctx.events.emit('activity.left', { activityId: id, userId: me.id, at: now });
    return view(ctx, id);
  },

  // Mes activités (spec app §6.2) : à venir (y compris en cours), passées, créées par moi.
  'activities.mine': async ({ scope, cursor, limit }, ctx) => {
    const me = viewer(ctx);
    const now = ctx.now();
    const endedBefore = notEndedSince(now);
    const offset = decodeCursor(cursor, isOffset) ?? 0;
    const size = pageSize(limit);
    const coming = and(isNull(activities.cancelledAt), gt(activities.startsAt, endedBefore));
    const ended = or(isNotNull(activities.cancelledAt), lte(activities.startsAt, endedBefore));
    const participating = sql`exists (select 1 from ${participations} p
      where p.activity_id = ${activities.id} and p.user_id = ${me})`;

    const base = ctx.db.select().from(activities);
    const rows =
      scope === 'upcoming'
        ? await base
            .where(and(participating, coming))
            .orderBy(asc(activities.startsAt), asc(activities.id))
            .limit(size + 1)
            .offset(offset)
        : scope === 'past'
          ? await base
              .where(and(participating, ne(activities.creatorId, me), ended))
              .orderBy(desc(activities.startsAt), desc(activities.id))
              .limit(size + 1)
              .offset(offset)
          : await base
              .where(eq(activities.creatorId, me))
              // Les prochaines d'abord (par date), puis les passées (la plus récente d'abord).
              .orderBy(
                sql`case when ${coming} then 0 else 1 end`,
                sql`case when ${coming} then ${activities.startsAt} end asc`,
                desc(activities.startsAt),
              )
              .limit(size + 1)
              .offset(offset);
    return offsetPage(ctx, rows, offset, size);
  },
};
