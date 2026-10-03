import { activitySchema, conversationSchema, paginatedSchema } from '@lokky/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { reports, sessions, users } from '../src/db/schema';
import { applyModeration } from '../src/modules/users/moderation';
import { createActivity, createMember } from './factories';
import { createTestApp, resetDatabase } from './helpers';

const NOW = new Date('2026-10-07T10:00:00Z');
const H = 3_600_000;
const at = (hours: number) => new Date(NOW.getTime() + hours * H);

let t: Awaited<ReturnType<typeof createTestApp>>;
beforeAll(async () => {
  t = await createTestApp({ now: () => NOW });
});
afterAll(() => t.close());
beforeEach(() => resetDatabase(t.db));

const feed = paginatedSchema(activitySchema);
const conversations = paginatedSchema(conversationSchema);

describe('avis et présence', () => {
  it('un avis par participant, après la sortie : la note du créateur suit', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    const { id } = await createActivity(t, moussa.id, {
      startsAt: at(-48),
      participantIds: [awa.id, fatou.id],
    });
    expect((await awa.call('GET', `/activities/${id}`)).json().viewerState.canReview).toBe(true);

    const review = (who: typeof awa, rating: number) =>
      who.call('POST', `/activities/${id}/reviews`, { creatorRating: rating, comment: 'Top' });
    expect((await review(awa, 5)).statusCode).toBe(200);
    expect((await review(fatou, 4)).statusCode).toBe(200);
    expect((await review(awa, 1)).json().error.code).toBe('conflict');

    expect((await awa.call('GET', `/activities/${id}`)).json().viewerState.canReview).toBe(false);
    const trust = (await awa.call('GET', `/users/${moussa.id}`)).json().trust;
    expect(trust).toMatchObject({ creatorRating: 4.5, creatorReviewCount: 2 });
  });

  it('refusé avant la fin, pour le créateur, ou sans avoir participé', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    const coming = await createActivity(t, moussa.id, {
      startsAt: at(8),
      participantIds: [awa.id],
    });
    const past = await createActivity(t, moussa.id, {
      startsAt: at(-48),
      participantIds: [awa.id],
    });
    const review = (who: typeof awa, activityId: string) =>
      who.call('POST', `/activities/${activityId}/reviews`, { creatorRating: 5 });
    expect((await review(awa, coming.id)).json().error.code).toBe('conflict');
    expect((await review(moussa, past.id)).json().error.code).toBe('forbidden');
    expect((await review(fatou, past.id)).json().error.code).toBe('not_participant');
  });

  it('présence déclarée une fois par le créateur : le taux de présence suit', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    const { id } = await createActivity(t, moussa.id, {
      startsAt: at(-48),
      participantIds: [awa.id, fatou.id],
    });
    expect(
      (await moussa.call('GET', `/activities/${id}`)).json().viewerState.canDeclareAttendance,
    ).toBe(true);
    expect(
      (
        await awa.call('POST', `/activities/${id}/attendance`, {
          attendance: [{ userId: fatou.id, attended: true }],
        })
      ).statusCode,
    ).toBe(403);

    const res = await moussa.call('POST', `/activities/${id}/attendance`, {
      attendance: [
        { userId: awa.id, attended: true },
        { userId: fatou.id, attended: false },
      ],
    });
    expect(res.statusCode).toBe(200);
    expect(
      (await moussa.call('GET', `/activities/${id}`)).json().viewerState.canDeclareAttendance,
    ).toBe(false);
    expect((await moussa.call('GET', `/users/${awa.id}`)).json().trust).toMatchObject({
      activitiesAttended: 1,
      attendanceRate: 1,
    });
    expect((await moussa.call('GET', `/users/${fatou.id}`)).json().trust).toMatchObject({
      activitiesAttended: 0,
      attendanceRate: 0,
    });
    const again = await moussa.call('POST', `/activities/${id}/attendance`, {
      attendance: [{ userId: awa.id, attended: true }],
    });
    expect(again.json().error.code).toBe('conflict');
  });
});

describe('blocage', () => {
  it('coupe tout : fil, profil, messages privés', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, {
      title: 'Footing',
      startsAt: at(-48),
      participantIds: [awa.id],
    });
    await createActivity(t, moussa.id, { title: 'Foot', startsAt: at(8) });
    const dm = (await awa.call('POST', '/conversations/direct', { userId: moussa.id })).json();

    expect((await awa.call('POST', '/me/blocks', { userId: moussa.id })).statusCode).toBe(200);

    // Fil : les sorties de Moussa disparaissent pour Awa… et celles d'Awa pour Moussa.
    expect(feed.parse((await awa.call('GET', '/activities')).json()).items).toHaveLength(0);
    // Profil : marqué bloqué pour Awa, introuvable pour Moussa.
    expect((await awa.call('GET', `/users/${moussa.id}`)).json().relationship).toEqual({
      canMessage: false,
      isBlocked: true,
    });
    expect((await moussa.call('GET', `/users/${awa.id}`)).statusCode).toBe(404);
    // Messages privés : conversation fermée, retirée de la liste, envoi refusé.
    expect((await awa.call('GET', `/conversations/${dm.id}`)).json().isReadOnly).toBe(true);
    const list = conversations.parse((await awa.call('GET', '/conversations')).json());
    expect(list.items.some((c) => c.id === dm.id)).toBe(false);
    const send = await moussa.call('POST', `/conversations/${dm.id}/messages`, {
      clientId: 'client-bloque',
      body: 'Coucou',
    });
    expect(send.statusCode).toBe(403);
    expect(
      (await moussa.call('POST', '/conversations/direct', { userId: awa.id })).statusCode,
    ).toBe(403);

    const blocked = (await awa.call('GET', '/me/blocks')).json();
    expect(blocked).toEqual([expect.objectContaining({ id: moussa.id, firstName: 'Moussa' })]);
  });

  it('débloquer rétablit la relation', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, { startsAt: at(-48), participantIds: [awa.id] });
    await awa.call('POST', '/me/blocks', { userId: moussa.id });
    expect((await awa.call('DELETE', `/me/blocks/${moussa.id}`)).statusCode).toBe(200);
    expect((await awa.call('GET', `/users/${moussa.id}`)).json().relationship).toEqual({
      canMessage: true,
      isBlocked: false,
    });
  });

  it('on ne se bloque pas soi-même', async () => {
    const awa = await createMember(t, 'Awa');
    expect((await awa.call('POST', '/me/blocks', { userId: awa.id })).statusCode).toBe(400);
  });
});

describe('signalement', () => {
  it('enregistré pour l’équipe, « autre » exige des détails', async () => {
    const awa = await createMember(t, 'Awa');
    const ok = await awa.call('POST', '/reports', {
      targetType: 'user',
      targetId: 'u_quelconque',
      reason: 'harassment',
    });
    expect(ok.statusCode).toBe(200);
    const rows = await t.db.select().from(reports);
    expect(rows).toEqual([
      expect.objectContaining({ reporterId: awa.id, reason: 'harassment', status: 'open' }),
    ]);
    const vague = await awa.call('POST', '/reports', {
      targetType: 'user',
      targetId: 'u_quelconque',
      reason: 'other',
    });
    expect(vague.statusCode).toBe(400);
  });
});

describe('suppression de compte', () => {
  it('compte anonyme, sessions coupées, sorties annulées ou quittées', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const mine = await createActivity(t, awa.id, { title: 'Thieb', startsAt: at(24) });
    const theirs = await createActivity(t, moussa.id, {
      title: 'Foot',
      startsAt: at(8),
      participantIds: [awa.id],
    });

    expect((await awa.call('DELETE', '/me')).statusCode).toBe(200);

    const [row] = await t.db.select().from(users).where(eq(users.id, awa.id));
    expect(row).toMatchObject({ firstName: 'Utilisateur supprimé', avatarUrl: null });
    expect(row?.deletedAt).not.toBeNull();
    expect(row?.email).not.toContain('@exemple.sn');
    expect(await t.db.select().from(sessions).where(eq(sessions.userId, awa.id))).toHaveLength(0);

    expect((await moussa.call('GET', `/activities/${mine.id}`)).json().status).toBe('cancelled');
    expect((await moussa.call('GET', `/activities/${theirs.id}`)).json().participantCount).toBe(1);
    expect((await moussa.call('GET', `/users/${awa.id}`)).statusCode).toBe(404);
  });
});

describe('modération', () => {
  it('compte suspendu : plus d’écriture, mais /me reste lisible', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await t.db.update(users).set({ onboardedAt: NOW }).where(eq(users.id, awa.id));
    await applyModeration(t.db, { userId: awa.id, status: 'suspended', until: at(48), now: NOW });

    const join = await awa.call('POST', `/activities/${id}/join`);
    expect(join.statusCode).toBe(403);
    expect(join.json().error.code).toBe('account_suspended');
    const me = await awa.call('GET', '/me');
    expect(me.json().moderation).toEqual({
      status: 'suspended',
      suspendedUntil: at(48).toISOString(),
    });
  });

  it('suspension terminée : l’écriture revient', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await applyModeration(t.db, { userId: awa.id, status: 'suspended', until: at(-1), now: NOW });
    expect((await awa.call('POST', `/activities/${id}/join`)).statusCode).toBe(200);
  });

  it('compte banni : refus explicite', async () => {
    const awa = await createMember(t, 'Awa');
    await applyModeration(t.db, { userId: awa.id, status: 'banned', now: NOW });
    const res = await awa.call('POST', '/reports', {
      targetType: 'user',
      targetId: 'x',
      reason: 'spam',
    });
    expect(res.json().error.code).toBe('account_banned');
  });
});
