import type { ActivityCategory, NeighborhoodId } from '@lokky/shared';
import { activities, participations, users } from '../src/db/schema';
import { uuidv7 } from '../src/lib/ids';
import { createGroup } from '../src/modules/chat/groups';
import type { createTestApp } from './helpers';

type TestApp = Awaited<ReturnType<typeof createTestApp>>;

// Données de test écrites directement en base (comptes déjà inscrits, sorties passées…),
// puis manipulées par l'API comme le ferait l'app.

let counter = 0;

export async function createMember(
  t: TestApp,
  firstName: string,
  { neighborhood = 'fann' as NeighborhoodId, now = t.now() } = {},
) {
  counter += 1;
  const id = uuidv7();
  await t.db.insert(users).values({
    id,
    email: `${firstName.toLowerCase()}${counter}@exemple.sn`,
    firstName,
    birthDate: '2000-01-01',
    status: 'student',
    neighborhood,
    interests: ['sport', 'beach', 'music'],
    onboardedAt: now,
    createdAt: now,
  });
  const token = await t.services.tokens.sign(id, uuidv7(), now);
  // Attend aussi les tâches d'arrière-plan (temps réel, planification) : les tests voient
  // l'état final, comme l'app quelques millisecondes plus tard.
  const call = async (
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    payload?: object,
  ) => {
    const res = await t.app.inject({
      method,
      url,
      payload,
      headers: { authorization: `Bearer ${token}` },
    });
    await t.app.events.settled();
    return res;
  };
  return { id, firstName, token, call };
}

export async function createActivity(
  t: TestApp,
  creatorId: string,
  {
    title = 'Foot à la plage',
    category = 'sport' as ActivityCategory,
    startsAt,
    capacity = 10,
    lat = 14.758,
    lng = -17.473,
    free = true,
    cancelledAt = null as Date | null,
    participantIds = [] as string[],
  }: {
    title?: string;
    category?: ActivityCategory;
    startsAt: Date;
    capacity?: number;
    lat?: number;
    lng?: number;
    free?: boolean;
    cancelledAt?: Date | null;
    participantIds?: string[];
  },
) {
  const id = uuidv7();
  await t.db.insert(activities).values({
    id,
    title,
    category,
    startsAt,
    placeName: 'Plage de Yoff',
    lat,
    lng,
    neighborhood: 'yoff',
    meetingPoint: null,
    capacity,
    costType: free ? 'free' : 'split',
    costEstimateFcfa: free ? null : 3000,
    creatorId,
    cancelledAt,
  });
  await t.db
    .insert(participations)
    .values([creatorId, ...participantIds].map((userId) => ({ activityId: id, userId })));
  const conversationId = await createGroup(t.db, id, creatorId, new Date());
  return { id, conversationId };
}
