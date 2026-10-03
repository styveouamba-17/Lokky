import { activitySchema, paginatedSchema } from '@lokky/shared';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { conversationMembers, participations } from '../src/db/schema';
import { createActivity, createMember } from './factories';
import { createTestApp, resetDatabase } from './helpers';

// Mercredi 7 octobre 2026, 10h à Dakar.
const NOW = new Date('2026-10-07T10:00:00Z');
const H = 3_600_000;
const at = (hours: number) => new Date(NOW.getTime() + hours * H);

let t: Awaited<ReturnType<typeof createTestApp>>;
beforeAll(async () => {
  t = await createTestApp({ now: () => NOW });
});
afterAll(() => t.close());
beforeEach(() => resetDatabase(t.db));

const feedPage = paginatedSchema(activitySchema);
const titles = (body: unknown) => feedPage.parse(body).items.map((a) => a.title);

const NEW_ACTIVITY = {
  title: 'Ciné en plein air',
  category: 'cinema',
  description: 'On regarde un film sur la Corniche.',
  startsAt: at(26).toISOString(),
  location: {
    name: 'Corniche Ouest',
    coordinates: { lat: 14.693, lng: -17.475 },
    neighborhood: 'fann',
    meetingPoint: 'Devant le phare',
  },
  capacity: 6,
  cost: { type: 'split', estimateFcfa: 3000 },
};

describe('créer une sortie', () => {
  it('le créateur est le premier participant, avec le groupe de discussion', async () => {
    const awa = await createMember(t, 'Awa');
    const res = await awa.call('POST', '/activities', NEW_ACTIVITY);
    expect(res.statusCode).toBe(200);
    const activity = activitySchema.parse(res.json());
    expect(activity).toMatchObject({
      title: 'Ciné en plein air',
      participantCount: 1,
      status: 'upcoming',
      cost: { type: 'split', estimateFcfa: 3000 },
      location: { meetingPoint: 'Devant le phare' },
      viewerState: { isCreator: true, isParticipant: true, canLeave: false },
    });
    expect(activity.viewerState.conversationId).toEqual(expect.any(String));
  });

  it('refuse un créneau trop proche', async () => {
    const awa = await createMember(t, 'Awa');
    const res = await awa.call('POST', '/activities', {
      ...NEW_ACTIVITY,
      startsAt: new Date(NOW.getTime() + 5 * 60_000).toISOString(),
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('fil Découvrir', () => {
  it('à venir seulement, par date, sans les annulées ni les passées', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, { title: 'Demain', startsAt: at(24) });
    await createActivity(t, moussa.id, { title: 'Ce soir', startsAt: at(8) });
    await createActivity(t, moussa.id, { title: 'Hier', startsAt: at(-24) });
    await createActivity(t, moussa.id, { title: 'Annulée', startsAt: at(5), cancelledAt: NOW });
    expect(titles((await awa.call('GET', '/activities')).json())).toEqual(['Ce soir', 'Demain']);
  });

  it('filtres : ce soir, gratuit, catégories', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, { title: 'Foot ce soir', startsAt: at(8) });
    await createActivity(t, moussa.id, {
      title: 'Ciné payant',
      category: 'cinema',
      startsAt: at(9),
      free: false,
    });
    await createActivity(t, moussa.id, { title: 'Foot demain', startsAt: at(30) });
    expect(titles((await awa.call('GET', '/activities?when=tonight')).json())).toEqual([
      'Foot ce soir',
      'Ciné payant',
    ]);
    expect(
      titles((await awa.call('GET', '/activities?when=tonight&freeOnly=true')).json()),
    ).toEqual(['Foot ce soir']);
    expect(titles((await awa.call('GET', '/activities?categories=cinema')).json())).toEqual([
      'Ciné payant',
    ]);
  });

  it('distance : rayon autour de la position et distance calculée', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, {
      title: 'Yoff',
      startsAt: at(5),
      lat: 14.758,
      lng: -17.473,
    });
    await createActivity(t, moussa.id, {
      title: 'Plateau',
      startsAt: at(6),
      lat: 14.668,
      lng: -17.433,
    });
    // Depuis Yoff, rayon de 5 km : le Plateau (≈ 11 km) est exclu.
    const res = await awa.call('GET', '/activities?lat=14.758&lng=-17.473&radiusKm=5');
    const page = feedPage.parse(res.json());
    expect(page.items.map((a) => a.title)).toEqual(['Yoff']);
    expect(page.items[0]?.distanceKm).toBe(0);
    const wide = feedPage.parse(
      (await awa.call('GET', '/activities?lat=14.758&lng=-17.473&radiusKm=25')).json(),
    );
    expect(wide.items[1]?.distanceKm).toBeGreaterThan(10);
  });

  it('pagination par curseur', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    for (let i = 1; i <= 5; i += 1) {
      await createActivity(t, moussa.id, { title: `Sortie ${i}`, startsAt: at(i) });
    }
    const first = feedPage.parse((await awa.call('GET', '/activities?limit=2')).json());
    expect(first.items.map((a) => a.title)).toEqual(['Sortie 1', 'Sortie 2']);
    const second = feedPage.parse(
      (await awa.call('GET', `/activities?limit=2&cursor=${first.nextCursor}`)).json(),
    );
    expect(second.items.map((a) => a.title)).toEqual(['Sortie 3', 'Sortie 4']);
    const bad = await awa.call('GET', '/activities?cursor=nimporte');
    expect(bad.statusCode).toBe(400);
  });
});

describe('Je viens ! et quitter', () => {
  it('rejoindre ajoute à la sortie et au groupe, sans doublon', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });

    const joined = activitySchema.parse((await awa.call('POST', `/activities/${id}/join`)).json());
    expect(joined).toMatchObject({
      participantCount: 2,
      viewerState: { isParticipant: true, canLeave: true, conversationId },
    });
    expect((await awa.call('POST', `/activities/${id}/join`)).json().participantCount).toBe(2);
    const [membership] = await t.db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, awa.id),
        ),
      );
    expect(membership).toBeDefined();
  });

  it('sortie complète, ou déjà commencée : refusée', async () => {
    const moussa = await createMember(t, 'Moussa');
    const fatou = await createMember(t, 'Fatou');
    const awa = await createMember(t, 'Awa');
    const full = await createActivity(t, moussa.id, {
      startsAt: at(8),
      capacity: 2,
      participantIds: [fatou.id],
    });
    expect((await awa.call('POST', `/activities/${full.id}/join`)).json().error.code).toBe(
      'activity_full',
    );
    const started = await createActivity(t, moussa.id, { startsAt: at(-1) });
    expect((await awa.call('POST', `/activities/${started.id}/join`)).json().error.code).toBe(
      'activity_started',
    );
  });

  it('dernière place : deux « Je viens ! » simultanés, un seul passe', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    const { id } = await createActivity(t, moussa.id, { startsAt: at(8), capacity: 2 });
    const results = await Promise.all([
      awa.call('POST', `/activities/${id}/join`),
      fatou.call('POST', `/activities/${id}/join`),
    ]);
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const rows = await t.db.select().from(participations).where(eq(participations.activityId, id));
    expect(rows).toHaveLength(2);
  });

  it('quitter retire de la sortie ; le créateur ne peut pas quitter', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, moussa.id, {
      startsAt: at(8),
      participantIds: [awa.id],
    });
    const left = await awa.call('POST', `/activities/${id}/leave`);
    expect(left.json()).toMatchObject({
      participantCount: 1,
      viewerState: { isParticipant: false, canJoin: true, conversationId: null },
    });
    expect((await moussa.call('POST', `/activities/${id}/leave`)).statusCode).toBe(403);
    expect((await awa.call('POST', `/activities/${id}/leave`)).json().error.code).toBe(
      'not_participant',
    );
  });
});

describe('modifier et annuler', () => {
  it('modification complète tant que personne n’a rejoint, puis limitée', async () => {
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    const created = (await awa.call('POST', '/activities', NEW_ACTIVITY)).json();
    const renamed = await awa.call('PATCH', `/activities/${created.id}`, { title: 'Ciné et thé' });
    expect(renamed.json().title).toBe('Ciné et thé');

    await fatou.call('POST', `/activities/${created.id}/join`);
    expect(
      (await awa.call('PATCH', `/activities/${created.id}`, { title: 'Autre' })).statusCode,
    ).toBe(403);
    const point = await awa.call('PATCH', `/activities/${created.id}`, {
      description: 'Apportez un plaid',
      location: { ...NEW_ACTIVITY.location, meetingPoint: 'Au parking' },
    });
    expect(point.json()).toMatchObject({
      description: 'Apportez un plaid',
      location: { meetingPoint: 'Au parking' },
    });
    expect(
      (await fatou.call('PATCH', `/activities/${created.id}`, { description: 'x' })).statusCode,
    ).toBe(403);
  });

  it('annuler : réservé au créateur, puis la sortie sort du fil', async () => {
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    const created = (await awa.call('POST', '/activities', NEW_ACTIVITY)).json();
    expect((await fatou.call('POST', `/activities/${created.id}/cancel`)).statusCode).toBe(403);
    const cancelled = await awa.call('POST', `/activities/${created.id}/cancel`);
    expect(cancelled.json().status).toBe('cancelled');
    expect(titles((await fatou.call('GET', '/activities')).json())).toEqual([]);
  });
});

describe('mes activités, confiance et profil public', () => {
  it('à venir, passées, créées', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, {
      title: 'Footing',
      startsAt: at(-48),
      participantIds: [awa.id],
    });
    await createActivity(t, moussa.id, {
      title: 'Révisions',
      startsAt: at(24),
      participantIds: [awa.id],
    });
    await createActivity(t, awa.id, { title: 'Thé passé', startsAt: at(-72) });
    await createActivity(t, awa.id, { title: 'Thieb', startsAt: at(100) });

    const mine = async (scope: string) =>
      titles((await awa.call('GET', `/me/activities?scope=${scope}`)).json());
    expect(await mine('upcoming')).toEqual(['Révisions', 'Thieb']);
    expect(await mine('past')).toEqual(['Footing']);
    expect(await mine('created')).toEqual(['Thieb', 'Thé passé']);
  });

  it('les statistiques de confiance suivent les sorties faites et organisées', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, { startsAt: at(-48), participantIds: [awa.id] });
    await createActivity(t, moussa.id, { startsAt: at(48) });
    const profile = (await awa.call('GET', `/users/${moussa.id}`)).json();
    expect(profile.trust).toEqual({
      activitiesAttended: 1,
      attendanceRate: null,
      activitiesCreated: 2,
      creatorRating: null,
      creatorReviewCount: 0,
    });
  });

  it('messages privés possibles seulement après une sortie passée ensemble', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    await createActivity(t, moussa.id, { startsAt: at(-48), participantIds: [awa.id] });
    await createActivity(t, fatou.id, { startsAt: at(48), participantIds: [awa.id] });
    expect((await awa.call('GET', `/users/${moussa.id}`)).json().relationship).toEqual({
      canMessage: true,
      isBlocked: false,
    });
    expect((await awa.call('GET', `/users/${fatou.id}`)).json().relationship.canMessage).toBe(
      false,
    );
  });

  it('profil public : seulement les prochaines sorties organisées', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, { title: 'Passée', startsAt: at(-48) });
    await createActivity(t, moussa.id, { title: 'Prochaine', startsAt: at(48) });
    await createActivity(t, awa.id, {
      title: 'Où va Moussa',
      startsAt: at(20),
      participantIds: [moussa.id],
    });
    expect(titles((await awa.call('GET', `/users/${moussa.id}/activities`)).json())).toEqual([
      'Prochaine',
    ]);
  });
});
