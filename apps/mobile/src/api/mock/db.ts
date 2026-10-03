import type {
  ActivityCategory,
  ActivityCost,
  ActivityLocation,
  City,
  Preferences,
  ReportInput,
  User,
} from '@lokky/shared';
import { buildSeed, buildSeedMessages } from './seed';

// preferences : absentes tant que l'utilisateur ne les a pas changées (valeurs par défaut).
export type MockUser = User & { email: string; birthDate: string; preferences?: Preferences };

export interface MockDirect {
  id: string;
  userIds: [string, string];
  createdAt: string;
}

export interface MockActivity {
  id: string;
  title: string;
  category: ActivityCategory;
  description: string;
  startsAt: string;
  location: ActivityLocation;
  capacity: number;
  cost: ActivityCost;
  creatorId: string;
  participantIds: string[]; // le créateur en fait partie
  cancelledAt: string | null;
  city: City;
  createdAt: string;
}

export interface MockMessage {
  id: string;
  clientId: string | null;
  conversationId: string;
  senderId: string | null; // null pour un message système
  type: 'text' | 'system';
  body: string;
  createdAt: string;
}

// Diffusion des nouveaux messages : le MockSocket s'y abonne comme le ferait le serveur.
export interface MockBus {
  publish: (message: MockMessage) => void;
  subscribe: (listener: (message: MockMessage) => void) => () => void;
}

function createMockBus(): MockBus {
  const listeners = new Set<(message: MockMessage) => void>();
  return {
    publish: (message) => listeners.forEach((listener) => listener(message)),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export interface MockDb {
  users: Map<string, MockUser>;
  activities: Map<string, MockActivity>;
  // Messages par conversation, du plus ancien au plus récent.
  messages: Map<string, MockMessage[]>;
  // Dernière lecture du spectateur, par conversation.
  readAt: Map<string, string>;
  bus: MockBus;
  // Avis laissés : activité → participants qui l'ont noté (une seule fois chacun).
  reviewedBy: Map<string, Set<string>>;
  // Sorties dont le créateur a déjà indiqué qui est venu.
  attendanceDeclared: Set<string>;
  // Conversations privées ouvertes (spec §6.3, règle 4).
  directs: Map<string, MockDirect>;
  // Blocages : « bloqueur>bloqué ».
  blocks: Map<string, string>; // clé → date du blocage
  reports: (ReportInput & { reporterId: string; createdAt: string })[];
  // Le compte connecté est toujours le spectateur simulé (MOCK_VIEWER_ID). Tant que
  // l'onboarding n'est pas fait, GET /me répond onboarding_required.
  viewerOnboarded: boolean;
}

export function createMockDb(now: Date, { viewerOnboarded = false } = {}): MockDb {
  const { users, activities } = buildSeed(now);
  const { messages, readAt, directs } = buildSeedMessages(now);
  return {
    users: new Map(users.map((u) => [u.id, u])),
    activities: new Map(activities.map((a) => [a.id, a])),
    messages,
    readAt,
    bus: createMockBus(),
    reviewedBy: new Map(),
    attendanceDeclared: new Set(),
    directs: new Map(directs.map((d) => [d.id, d])),
    blocks: new Map(),
    reports: [],
    viewerOnboarded,
  };
}
