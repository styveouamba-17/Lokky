import {
  getActivityStatus,
  haversineKm,
  isChatReadOnly,
  LIMITS,
  type Activity,
  type Conversation,
  type Coordinates,
  type Message,
  type Me,
  type User,
  type UserPreview,
  type UserProfile,
} from '@lokky/shared';
import type { MockActivity, MockDb, MockDirect, MockMessage, MockUser } from './db';
import { groupConversationId } from './ids';

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

export const DEFAULT_PREFERENCES: Me['preferences'] = {
  language: 'fr',
  theme: 'system',
  notifications: { messages: true, activityUpdates: true, reminders: true },
};

// La modération n'est pas simulée : compte toujours actif.
export const toMe = (u: MockUser): Me => ({
  ...toPublicUser(u),
  email: u.email,
  birthDate: u.birthDate,
  preferences: u.preferences ?? DEFAULT_PREFERENCES,
  moderation: { status: 'active', suspendedUntil: null, warnedAt: null },
});

export const toUserProfile = (
  u: MockUser,
  relationship: UserProfile['relationship'],
): UserProfile => ({ ...toPublicUser(u), relationship });

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
      canReview:
        status === 'past' &&
        isParticipant &&
        !isCreator &&
        !(db.reviewedBy.get(a.id)?.has(viewerId) ?? false),
      canDeclareAttendance:
        status === 'past' &&
        isCreator &&
        a.participantIds.length > 1 &&
        !db.attendanceDeclared.has(a.id),
      conversationId: isParticipant ? groupConversationId(a.id) : null,
    },
    createdAt: a.createdAt,
  };
}

export const toMessage = (m: MockMessage, db: MockDb): Message => {
  const sender = m.senderId ? db.users.get(m.senderId) : undefined;
  const replied = m.replyToMessageId
    ? [...db.messages.values()]
        .flat()
        .find((candidate) => candidate.id === m.replyToMessageId && candidate.type === 'text')
    : undefined;
  const replySender = replied?.senderId ? db.users.get(replied.senderId) : undefined;
  return {
    id: m.id,
    clientId: m.clientId,
    conversationId: m.conversationId,
    sender: sender ? toUserPreview(sender) : null,
    type: m.type,
    body: m.body,
    replyTo: replied
      ? {
          id: replied.id,
          body: replied.body,
          sender: replySender ? toUserPreview(replySender) : null,
        }
      : null,
    editedAt: m.editedAt ?? null,
    createdAt: m.createdAt,
  };
};

// Non lus : messages des autres (hors messages système) après la dernière lecture.
export function unreadCount(db: MockDb, conversationId: string, viewerId: string): number {
  const readAt = db.readAt.get(conversationId) ?? '';
  return (db.messages.get(conversationId) ?? []).filter(
    (m) => m.type === 'text' && m.senderId !== viewerId && m.createdAt > readAt,
  ).length;
}

export function toGroupConversation(
  a: MockActivity,
  db: MockDb,
  viewerId: string,
  now: Date,
): Conversation {
  const id = groupConversationId(a.id);
  const last = (db.messages.get(id) ?? []).at(-1);
  return {
    id,
    type: 'group',
    activityId: a.id,
    activityCategory: a.category,
    peer: null,
    title: a.title,
    avatarUrl: null,
    lastMessage: last ? toMessage(last, db) : null,
    unreadCount: unreadCount(db, id, viewerId),
    isReadOnly: isChatReadOnly(
      new Date(a.startsAt),
      a.cancelledAt ? new Date(a.cancelledAt) : null,
      now,
    ),
    updatedAt: last?.createdAt ?? a.createdAt,
  };
}

// Conversation privée vue par le spectateur : titre et photo de l'autre personne. Fermée en
// lecture seule dès que l'un a bloqué l'autre.
export function toDirectConversation(
  d: MockDirect,
  db: MockDb,
  viewerId: string,
  isBlocked: boolean,
): Conversation {
  const peerId = d.userIds.find((id) => id !== viewerId) ?? d.userIds[0];
  const peer = getUser(db, peerId);
  const last = (db.messages.get(d.id) ?? []).at(-1);
  return {
    id: d.id,
    type: 'direct',
    activityId: null,
    activityCategory: null,
    peer: toUserPreview(peer),
    title: peer.firstName,
    avatarUrl: peer.avatarUrl,
    lastMessage: last ? toMessage(last, db) : null,
    unreadCount: unreadCount(db, d.id, viewerId),
    isReadOnly: isBlocked,
    updatedAt: last?.createdAt ?? d.createdAt,
  };
}
