import { createMockDb } from '../db';
import { mockHandlers } from '../handlers';
import { createMockClient } from '../mockClient';
import { withAttendance, withRating } from '../trustHandlers';

// Mercredi 7 octobre 2026, 10h (Dakar).
const NOW = new Date('2026-10-07T10:00:00Z');

function setup() {
  const db = createMockDb(NOW, { viewerOnboarded: true });
  const client = createMockClient({
    handlers: mockHandlers,
    db,
    now: () => NOW,
    sleep: () => Promise.resolve(),
  });
  return { db, client };
}

const ids = (page: { items: { id: string }[] }) => page.items.map((a) => a.id);

describe('client simulé : mes activités', () => {
  it('à venir : les sorties où je vais, par date', async () => {
    const page = await setup().client.request('activities.mine', { scope: 'upcoming' });
    expect(ids(page)).toEqual(['a_bu', 'a_mamelles', 'a_thieb']);
  });

  it('passées : celles des autres où je suis allée, la plus récente d’abord', async () => {
    const page = await setup().client.request('activities.mine', { scope: 'past' });
    expect(ids(page)).toEqual(['a_footing']);
    expect(page.items[0]?.viewerState.canReview).toBe(true);
  });

  it('créées par moi : les prochaines d’abord, puis les passées', async () => {
    const page = await setup().client.request('activities.mine', { scope: 'created' });
    expect(ids(page)).toEqual(['a_thieb', 'a_the']);
    expect(page.items[1]?.viewerState.canDeclareAttendance).toBe(true);
  });
});

describe('client simulé : avis', () => {
  it('note le créateur une seule fois et met sa note à jour', async () => {
    const { client } = setup();
    await client.request('reviews.create', { activityId: 'a_footing', creatorRating: 3 });
    const moussa = await client.request('users.get', { id: 'u_moussa' });
    expect(moussa.trust).toMatchObject({ creatorRating: 4.7, creatorReviewCount: 22 });

    const activity = await client.request('activities.get', { id: 'a_footing' });
    expect(activity.viewerState.canReview).toBe(false);
    await expect(
      client.request('reviews.create', { activityId: 'a_footing', creatorRating: 5 }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('refuse un avis sur une sortie pas encore passée', async () => {
    await expect(
      setup().client.request('reviews.create', { activityId: 'a_bu', creatorRating: 5 }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('refuse un avis sur sa propre sortie', async () => {
    await expect(
      setup().client.request('reviews.create', { activityId: 'a_the', creatorRating: 5 }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('client simulé : présence', () => {
  it('le créateur indique qui est venu, une seule fois', async () => {
    const { client } = setup();
    await client.request('activities.attendance', {
      activityId: 'a_the',
      attendance: [
        { userId: 'u_mariama', attended: true },
        { userId: 'u_ibrahima', attended: false },
      ],
    });
    const mariama = await client.request('users.get', { id: 'u_mariama' });
    expect(mariama.trust).toMatchObject({ activitiesAttended: 1, attendanceRate: 1 });
    const ibrahima = await client.request('users.get', { id: 'u_ibrahima' });
    expect(ibrahima.trust).toMatchObject({ activitiesAttended: 0, attendanceRate: 0 });

    const activity = await client.request('activities.get', { id: 'a_the' });
    expect(activity.viewerState.canDeclareAttendance).toBe(false);
    await expect(
      client.request('activities.attendance', {
        activityId: 'a_the',
        attendance: [{ userId: 'u_mariama', attended: true }],
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('seul le créateur peut le faire', async () => {
    await expect(
      setup().client.request('activities.attendance', {
        activityId: 'a_footing',
        attendance: [{ userId: 'u_ousmane', attended: true }],
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('calcul des statistiques', () => {
    const base = {
      activitiesAttended: 4,
      attendanceRate: 0.8,
      activitiesCreated: 0,
      creatorRating: null,
      creatorReviewCount: 0,
    };
    expect(withAttendance(base, true)).toMatchObject({
      activitiesAttended: 5,
      attendanceRate: 0.83,
    });
    expect(withRating(base, 4)).toMatchObject({ creatorRating: 4, creatorReviewCount: 1 });
  });
});

describe('client simulé : profil public', () => {
  it('ne montre que les prochaines sorties organisées par la personne', async () => {
    const page = await setup().client.request('users.activities', { id: 'u_cheikh' });
    expect(ids(page)).toEqual(['a_jeux', 'a_concert']);
  });
});
