import {
  getActivityStatus,
  haversineKm,
  LIMITS,
  type Activity,
  type Coordinates,
  type User,
  type UserPreview,
} from '@lokky/shared';
import type { MockActivity, MockDb, MockUser } from './db';

export const toUserPreview = (u: MockUser): UserPreview => ({
  id: u.id,
  firstName: u.firstName,
  avatarUrl: u.avatarUrl,
});

export const toPublicUser = (u: MockUser): User => ({
  ...toUserPreview(u),
  status: u.status,
  neighborhood: u.neighborhood,
  interests: u.interests,
  trust: u.trust,
});

function getUser(db: MockDb, id: string): MockUser {
  const found = db.users.get(id);
  if (!found) throw new Error(`Utilisateur simulé introuvable : ${id}`);
  return found;
}

export function toActivity(
  a: MockActivity,
  db: MockDb,
  viewerId: string,
  now: Date,
  origin: Coordinates | null,
): Activity {
  const creator = getUser(db, a.creatorId);
  const participants = a.participantIds.map((id) => getUser(db, id));
  const status = getActivityStatus(
    new Date(a.startsAt),
    a.cancelledAt ? new Date(a.cancelledAt) : null,
    now,
  );
  const isParticipant = a.participantIds.includes(viewerId);
  const isCreator = a.creatorId === viewerId;
  const isFull = participants.length >= a.capacity;
  const upcoming = status === 'upcoming';

  return {
    id: a.id,
    title: a.title,
    category: a.category,
    description: a.description,
    startsAt: a.startsAt,
    location: a.location,
    capacity: a.capacity,
    cost: a.cost,
    creator: { ...toUserPreview(creator), trust: creator.trust },
    participantCount: participants.length,
    participantsPreview: participants
      .slice(0, LIMITS.activity.participantsPreviewMax)
      .map(toUserPreview),
    firstTimerCount: participants.filter(
      (p) => p.id !== viewerId && p.trust.activitiesAttended === 0,
    ).length,
    status,
    city: a.city,
    distanceKm: origin ? Math.round(haversineKm(origin, a.location.coordinates) * 10) / 10 : null,
    viewerState: {
      isParticipant,
      isCreator,
      canJoin: upcoming && !isParticipant && !isFull,
      canLeave: upcoming && isParticipant && !isCreator,
      canReview: status === 'past' && isParticipant && !isCreator,
    },
    createdAt: a.createdAt,
  };
}
