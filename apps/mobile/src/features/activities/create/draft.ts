import {
  categorySchema,
  LIMITS,
  NEIGHBORHOODS,
  neighborhoodSchema,
  POPULAR_PLACES,
  startOfDakarDay,
  type Activity,
  type CreateActivityInput,
  type Me,
} from '@lokky/shared';
import { z } from 'zod';

const L = LIMITS.activity;
const DAY_MS = 86_400_000;

// Brouillon du formulaire de création (spec §6.2). Champs validés étape par étape, puis
// convertis en entrée du contrat, que le schéma partagé revalide à la publication.
export const draftSchema = z.object({
  category: categorySchema,
  title: z.string().trim().min(L.titleMin).max(L.titleMax),
  description: z.string().trim().max(L.descriptionMax),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  placeId: z.string().nullable(),
  placeName: z.string().trim().min(2).max(L.placeNameMax),
  neighborhood: neighborhoodSchema,
  meetingPoint: z.string().trim().max(L.meetingPointMax),
  capacity: z.number().int().min(L.capacityMin).max(L.capacityMax),
  costType: z.enum(['free', 'split']),
  estimate: z
    .string()
    .regex(/^\d*$/)
    .refine((v) => v === '' || (Number(v) > 0 && Number(v) <= L.estimateFcfaMax)),
});

export type Draft = z.input<typeof draftSchema>;
export type DraftField = keyof Draft;

export const STEP_FIELDS: DraftField[][] = [
  ['category', 'title', 'description'],
  ['day', 'time'],
  ['placeName', 'neighborhood', 'meetingPoint'],
  ['capacity'],
  ['costType', 'estimate'],
  [],
];
export const STEP_COUNT = STEP_FIELDS.length;
export const DEFAULT_CAPACITY = 6;

// Dakar = UTC+0 toute l'année : un jour AAAA-MM-JJ et une heure HH:MM donnent un instant UTC.
export const toStartsAt = (day: string, time: string) => new Date(`${day}T${time}:00Z`);
export const isoDay = (date: Date) => date.toISOString().slice(0, 10);

// Jours proposés : aujourd'hui puis les 13 suivants.
export function dayOptions(now: Date, count = 14): Date[] {
  const start = startOfDakarDay(now).getTime();
  return Array.from({ length: count }, (_, i) => new Date(start + i * DAY_MS));
}

// Créneaux de 30 min, de 7h à 23h30, encore possibles ce jour-là (départ dans 15 min au moins).
export function timeSlots(day: string, now: Date): string[] {
  const earliest = now.getTime() + L.minLeadMinutes * 60_000;
  const slots: string[] = [];
  for (let minutes = 7 * 60; minutes <= 23 * 60 + 30; minutes += 30) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 === 0 ? '00' : '30'}`;
    if (toStartsAt(day, time).getTime() >= earliest) slots.push(time);
  }
  return slots;
}

// Raccourcis de la spec : « Ce soir », « Demain », « Samedi ».
export function nextSaturday(now: Date): Date {
  const today = startOfDakarDay(now);
  const delta = (6 - today.getUTCDay() + 7) % 7;
  return new Date(today.getTime() + delta * DAY_MS);
}

export function toCreateInput(draft: z.output<typeof draftSchema>): CreateActivityInput {
  const place = POPULAR_PLACES.find((p) => p.id === draft.placeId);
  return {
    title: draft.title,
    category: draft.category,
    description: draft.description,
    startsAt: toStartsAt(draft.day, draft.time).toISOString(),
    location: {
      name: draft.placeName,
      // Lieu saisi librement : coordonnées du quartier (pas de géocodage en v1).
      coordinates: place?.coordinates ?? NEIGHBORHOODS[draft.neighborhood].coordinates,
      neighborhood: place?.neighborhood ?? draft.neighborhood,
      meetingPoint: draft.meetingPoint || null,
    },
    capacity: draft.capacity,
    cost:
      draft.costType === 'free'
        ? { type: 'free' }
        : draft.estimate
          ? { type: 'split', estimateFcfa: Number(draft.estimate) }
          : { type: 'split' },
  };
}

// Activité telle qu'elle apparaîtra dans Découvrir (récapitulatif), avant publication.
export function previewActivity(input: CreateActivityInput, me: Me, now: Date): Activity {
  const self = { id: me.id, firstName: me.firstName, avatarUrl: me.avatarUrl };
  return {
    id: 'preview',
    title: input.title,
    category: input.category,
    description: input.description ?? '',
    startsAt: input.startsAt,
    location: input.location,
    capacity: input.capacity,
    cost: input.cost,
    creator: { ...self, trust: me.trust },
    participantCount: 1,
    participantsPreview: [self],
    firstTimerCount: 0,
    status: 'upcoming',
    city: 'dakar',
    distanceKm: null,
    viewerState: {
      isParticipant: true,
      isCreator: true,
      canJoin: false,
      canLeave: false,
      canReview: false,
      canDeclareAttendance: false,
      conversationId: null,
    },
    createdAt: now.toISOString(),
  };
}
