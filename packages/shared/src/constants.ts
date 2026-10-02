export const CITIES = ['dakar'] as const;
export type City = (typeof CITIES)[number];

export const ACTIVITY_CATEGORIES = [
  'sport',
  'beach',
  'cinema',
  'study',
  'music',
  'games',
  'food',
  'culture',
  'walk',
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const USER_STATUSES = ['student', 'newcomer', 'other'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ACTIVITY_STATUSES = ['upcoming', 'ongoing', 'past', 'cancelled'] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const NEIGHBORHOOD_IDS = [
  'plateau',
  'medina',
  'fann',
  'point-e',
  'mermoz',
  'sacre-coeur',
  'ouakam',
  'ngor',
  'yoff',
  'almadies',
  'liberte',
  'grand-yoff',
  'parcelles',
  'hlm',
  'hann',
  'pikine',
  'guediawaye',
] as const;
export type NeighborhoodId = (typeof NEIGHBORHOOD_IDS)[number];

// Coordonnées approximatives du centre de chaque quartier : repli quand la localisation est refusée.
export const NEIGHBORHOODS: Record<
  NeighborhoodId,
  { name: string; coordinates: { lat: number; lng: number } }
> = {
  plateau: { name: 'Plateau', coordinates: { lat: 14.668, lng: -17.433 } },
  medina: { name: 'Médina', coordinates: { lat: 14.683, lng: -17.45 } },
  fann: { name: 'Fann', coordinates: { lat: 14.693, lng: -17.463 } },
  'point-e': { name: 'Point E', coordinates: { lat: 14.695, lng: -17.456 } },
  mermoz: { name: 'Mermoz', coordinates: { lat: 14.708, lng: -17.475 } },
  'sacre-coeur': { name: 'Sacré-Cœur', coordinates: { lat: 14.72, lng: -17.468 } },
  ouakam: { name: 'Ouakam', coordinates: { lat: 14.724, lng: -17.488 } },
  ngor: { name: 'Ngor', coordinates: { lat: 14.747, lng: -17.513 } },
  yoff: { name: 'Yoff', coordinates: { lat: 14.756, lng: -17.471 } },
  almadies: { name: 'Almadies', coordinates: { lat: 14.741, lng: -17.52 } },
  liberte: { name: 'Liberté', coordinates: { lat: 14.718, lng: -17.456 } },
  'grand-yoff': { name: 'Grand Yoff', coordinates: { lat: 14.733, lng: -17.451 } },
  parcelles: { name: 'Parcelles Assainies', coordinates: { lat: 14.765, lng: -17.44 } },
  hlm: { name: 'HLM', coordinates: { lat: 14.711, lng: -17.44 } },
  hann: { name: 'Hann', coordinates: { lat: 14.723, lng: -17.428 } },
  pikine: { name: 'Pikine', coordinates: { lat: 14.755, lng: -17.39 } },
  guediawaye: { name: 'Guédiawaye', coordinates: { lat: 14.777, lng: -17.397 } },
};

export const LIMITS = {
  user: {
    firstNameMin: 2,
    firstNameMax: 30,
    interestsMin: 3,
    interestsMax: 9,
    minAge: 18,
    maxAge: 100,
  },
  activity: {
    titleMin: 3,
    titleMax: 60,
    descriptionMax: 500,
    placeNameMax: 80,
    meetingPointMax: 120,
    capacityMin: 2,
    capacityMax: 20,
    estimateFcfaMax: 100_000,
    participantsPreviewMax: 5,
    minLeadMinutes: 15,
    maxAheadDays: 60,
    defaultRadiusKm: 25,
    radiusKmMax: 50,
  },
  message: { bodyMax: 2000 },
  review: { commentMax: 300 },
  report: { detailsMin: 10, detailsMax: 500 },
  pagination: { defaultLimit: 20, maxLimit: 50 },
} as const;

export const ACTIVITY_ONGOING_HOURS = 3;
export const CHAT_READONLY_AFTER_DAYS = 7;
