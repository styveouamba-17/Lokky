import type { StaffRole } from '@lokky/shared/admin';
import {
  adminActivityDetailSchema,
  adminReportDetailSchema,
  adminReportSchema,
  adminStatsSchema,
  adminUserDetailSchema,
  adminUserRowSchema,
  auditEntrySchema,
  pageOf,
} from '@lokky/shared/admin';
import { eq } from 'drizzle-orm';
import { Redis } from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { adminAudit, users } from '../src/db/schema';
import { MODERATION_CHANNEL } from '../src/modules/users/moderation';
import { TEST_REDIS_URL } from './env';
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

const CSRF = { 'x-lokky-admin': '1' };

const emailOf = async (id: string) =>
  (await t.db.select({ email: users.email }).from(users).where(eq(users.id, id)))[0]!.email;

// Membre de l'équipe connecté à l'admin : renvoie un appelant qui porte son cookie.
async function staffMember(firstName: string, role: StaffRole) {
  const member = await createMember(t, firstName);
  await t.db.update(users).set({ staffRole: role }).where(eq(users.id, member.id));
  const email = await emailOf(member.id);
  await t.app.inject({
    method: 'POST',
    url: '/admin/auth/start',
    payload: { email },
    headers: CSRF,
  });
  const verify = await t.app.inject({
    method: 'POST',
    url: '/admin/auth/verify',
    payload: { email, code: t.lastCode(email) },
    headers: CSRF,
  });
  expect(verify.statusCode).toBe(200);
  const cookie = String(verify.headers['set-cookie']).split(';')[0]!;
  const call = async (method: 'GET' | 'POST', url: string, payload?: object) => {
    const res = await t.app.inject({ method, url, payload, headers: { ...CSRF, cookie } });
    await t.app.events.settled();
    return res;
  };
  return { ...member, email, cookie, call };
}

describe('connexion à l’admin', () => {
  it('réservée à l’équipe, sans révéler qui en fait partie', async () => {
    const awa = await createMember(t, 'Awa');
    const email = await emailOf(awa.id);
    const start = await t.app.inject({
      method: 'POST',
      url: '/admin/auth/start',
      payload: { email },
      headers: CSRF,
    });
    expect(start.statusCode).toBe(200);
    expect(t.lastCode(email)).toBeUndefined();
    const verify = await t.app.inject({
      method: 'POST',
      url: '/admin/auth/verify',
      payload: { email, code: '123456' },
      headers: CSRF,
    });
    expect(verify.json().error.code).toBe('validation');
  });

  it('cookie httpOnly, en-tête anti-CSRF exigé, déconnexion', async () => {
    const mod = await staffMember('Khady', 'moderator');
    expect(mod.cookie).toMatch(/^lokky_admin=/);
    const me = await mod.call('GET', '/admin/me');
    expect(me.json()).toMatchObject({ id: mod.id, role: 'moderator' });
    expect(me.headers['cache-control']).toBe('no-store');

    const noHeader = await t.app.inject({
      method: 'GET',
      url: '/admin/me',
      headers: { cookie: mod.cookie },
    });
    expect(noHeader.statusCode).toBe(403);

    expect((await mod.call('POST', '/admin/auth/logout')).statusCode).toBe(200);
    expect((await mod.call('GET', '/admin/me')).statusCode).toBe(401);
  });

  it('un rôle retiré ou un compte suspendu perd l’accès tout de suite', async () => {
    const mod = await staffMember('Khady', 'moderator');
    await t.db.update(users).set({ staffRole: null }).where(eq(users.id, mod.id));
    expect((await mod.call('GET', '/admin/me')).statusCode).toBe(401);

    const other = await staffMember('Ibou', 'moderator');
    await t.db
      .update(users)
      .set({ moderationStatus: 'suspended', suspendedUntil: at(24) })
      .where(eq(users.id, other.id));
    expect((await other.call('GET', '/admin/me')).statusCode).toBe(401);
  });

  it('le jeton de l’app mobile n’ouvre pas l’admin', async () => {
    const admin = await createMember(t, 'Moussa');
    await t.db.update(users).set({ staffRole: 'admin' }).where(eq(users.id, admin.id));
    const res = await t.app.inject({
      method: 'GET',
      url: '/admin/me',
      headers: { ...CSRF, authorization: `Bearer ${admin.token}` },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('signalements', () => {
  it('file, contexte du message, une décision clôt toute l’affaire', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    const { id, conversationId } = await createActivity(t, moussa.id, {
      startsAt: at(8),
      participantIds: [awa.id, fatou.id],
    });
    const sent = await moussa.call('POST', `/conversations/${conversationId}/messages`, {
      clientId: 'client-bad-1',
      body: 'Message déplacé',
    });
    const messageId = sent.json().id as string;
    for (const who of [awa, fatou]) {
      await who.call('POST', '/reports', {
        targetType: 'message',
        targetId: messageId,
        reason: 'harassment',
      });
    }
    await awa.call('POST', '/reports', { targetType: 'activity', targetId: id, reason: 'fake' });

    const list = pageOf(adminReportSchema).parse(
      (await mod.call('GET', '/admin/reports?targetType=message')).json(),
    );
    expect(list.total).toBe(2);
    const first = list.items[0]!;
    expect(first).toMatchObject({ status: 'open', sameTargetOpen: 2 });
    expect(first.target).toMatchObject({
      type: 'message',
      message: { body: 'Message déplacé', sender: { id: moussa.id }, activity: { id } },
    });

    const detail = adminReportDetailSchema.parse(
      (await mod.call('GET', `/admin/reports/${first.id}`)).json(),
    );
    expect(detail.concernedUser).toMatchObject({ id: moussa.id, openReports: 3 });
    expect(detail.related).toHaveLength(1);
    expect(detail.context.map((m) => m.id)).toContain(messageId);

    const resolve = await mod.call('POST', `/admin/reports/${first.id}/resolve`, {
      status: 'resolved',
      note: 'Averti',
    });
    expect(resolve.json()).toEqual({ updated: 2 });
    const again = await mod.call('POST', `/admin/reports/${first.id}/resolve`, {
      status: 'dismissed',
    });
    expect(again.json().error.code).toBe('conflict');

    const open = pageOf(adminReportSchema).parse((await mod.call('GET', '/admin/reports')).json());
    expect(open.items.map((r) => r.target.type)).toEqual(['activity']);
    const resolved = pageOf(adminReportSchema).parse(
      (await mod.call('GET', '/admin/reports?status=resolved')).json(),
    );
    expect(resolved.items[0]).toMatchObject({ handledBy: { id: mod.id }, note: 'Averti' });
  });

  it('lire le contexte d’une conversation privée est journalisé', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    await createActivity(t, moussa.id, { startsAt: at(-48), participantIds: [awa.id] });
    const dm = (await awa.call('POST', '/conversations/direct', { userId: moussa.id })).json();
    const sent = await moussa.call('POST', `/conversations/${dm.id}/messages`, {
      clientId: 'client-dm-1',
      body: 'Insulte',
    });
    await awa.call('POST', '/reports', {
      targetType: 'message',
      targetId: sent.json().id,
      reason: 'harassment',
    });
    const [report] = pageOf(adminReportSchema).parse(
      (await mod.call('GET', '/admin/reports')).json(),
    ).items;
    await mod.call('GET', `/admin/reports/${report!.id}`);
    const log = await t.db.select().from(adminAudit).where(eq(adminAudit.actorId, mod.id));
    expect(log.map((l) => l.action).sort()).toEqual(['report.context.view', 'session.open']);
  });
});

describe('comptes', () => {
  it('suspendre : l’app est prévenue, l’écriture bloquée, l’historique nomme le modérateur', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const awa = await createMember(t, 'Awa');
    const subscriber = new Redis(TEST_REDIS_URL);
    const notices: string[] = [];
    await subscriber.subscribe(MODERATION_CHANNEL);
    subscriber.on('message', (_channel, message) => notices.push(message));

    const res = await mod.call('POST', `/admin/users/${awa.id}/moderation`, {
      status: 'suspended',
      days: 3,
      reason: 'Propos insultants',
    });
    expect(res.statusCode).toBe(200);
    const detail = adminUserDetailSchema.parse(res.json());
    expect(detail.moderation).toEqual({
      status: 'suspended',
      suspendedUntil: at(72).toISOString(),
    });
    expect(detail.history[0]).toMatchObject({
      status: 'suspended',
      reason: 'Propos insultants',
      actor: { id: mod.id, firstName: 'Khady' },
    });

    const write = await awa.call('POST', '/me/blocks', { userId: mod.id });
    expect(write.json().error.code).toBe('account_suspended');

    await expect.poll(() => notices.length).toBe(1);
    expect(JSON.parse(notices[0]!)).toMatchObject({ userId: awa.id, status: 'suspended' });
    subscriber.disconnect();
  });

  it('bannir est réservé aux administrateurs ; personne ne se modère soi-même', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const admin = await staffMember('Moussa', 'admin');
    const awa = await createMember(t, 'Awa');
    const ban = { status: 'banned', reason: 'Comportement dangereux' };

    expect((await mod.call('POST', `/admin/users/${awa.id}/moderation`, ban)).statusCode).toBe(403);
    expect(
      (
        await mod.call('POST', `/admin/users/${admin.id}/moderation`, {
          status: 'warned',
          reason: 'Test',
        })
      ).statusCode,
    ).toBe(403);
    expect((await admin.call('POST', `/admin/users/${admin.id}/moderation`, ban)).statusCode).toBe(
      403,
    );
    expect((await admin.call('POST', `/admin/users/${awa.id}/moderation`, ban)).statusCode).toBe(
      200,
    );
    // Un bannissement ne se lève que par un administrateur.
    const lift = { status: 'active', reason: 'Erreur' };
    expect((await mod.call('POST', `/admin/users/${awa.id}/moderation`, lift)).statusCode).toBe(
      403,
    );
    expect((await admin.call('POST', `/admin/users/${awa.id}/moderation`, lift)).statusCode).toBe(
      200,
    );
  });

  it('suspendre exige une durée', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const awa = await createMember(t, 'Awa');
    const res = await mod.call('POST', `/admin/users/${awa.id}/moderation`, {
      status: 'suspended',
      reason: 'Spam',
    });
    expect(res.json().error.code).toBe('validation');
  });

  it('recherche par prénom ou email, filtre par statut, plus signalés d’abord', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const awa = await createMember(t, 'Awa');
    const aminata = await createMember(t, 'Aminata');
    await createMember(t, 'Fatou');
    await awa.call('POST', '/reports', {
      targetType: 'user',
      targetId: aminata.id,
      reason: 'spam',
    });

    const page = pageOf(adminUserRowSchema);
    const found = page.parse((await mod.call('GET', '/admin/users?q=am')).json());
    expect(found.items.map((u) => u.firstName)).toEqual(['Aminata']);
    const all = page.parse((await mod.call('GET', '/admin/users')).json());
    expect(all.total).toBe(4);
    expect(all.items[0]).toMatchObject({ id: aminata.id, openReports: 1 });
    // Les jokers SQL tapés dans la recherche sont pris à la lettre.
    expect(page.parse((await mod.call('GET', '/admin/users?q=%25')).json()).total).toBe(0);

    await mod.call('POST', `/admin/users/${awa.id}/moderation`, {
      status: 'warned',
      reason: 'Ton',
    });
    const warned = page.parse((await mod.call('GET', '/admin/users?filter=warned')).json());
    expect(warned.items.map((u) => u.id)).toEqual([awa.id]);
  });

  it('fiche : sorties, signalements reçus et faits', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, moussa.id, {
      startsAt: at(8),
      participantIds: [awa.id],
    });
    await awa.call('POST', '/reports', { targetType: 'activity', targetId: id, reason: 'fake' });

    const detail = adminUserDetailSchema.parse(
      (await mod.call('GET', `/admin/users/${moussa.id}`)).json(),
    );
    expect(detail.activities).toMatchObject([{ id, role: 'creator', participantCount: 2 }]);
    expect(detail.reportsReceived).toHaveLength(1);
    expect(detail.openReports).toBe(1);
    const awaDetail = adminUserDetailSchema.parse(
      (await mod.call('GET', `/admin/users/${awa.id}`)).json(),
    );
    expect(awaDetail).toMatchObject({ reportsMade: 1, activities: [{ role: 'participant' }] });
  });
});

describe('sorties', () => {
  it('liste filtrée, chat consulté (journalisé), annulation par l’équipe', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const coming = await createActivity(t, moussa.id, {
      title: 'Thiéboudienne party',
      startsAt: at(8),
      participantIds: [awa.id],
    });
    await createActivity(t, moussa.id, { title: 'Foot', startsAt: at(-48) });
    await moussa.call('POST', `/conversations/${coming.conversationId}/messages`, {
      clientId: 'client-hello',
      body: 'Salut tout le monde',
    });

    const upcoming = (await mod.call('GET', '/admin/activities?filter=upcoming')).json();
    expect(upcoming.items.map((a: { id: string }) => a.id)).toEqual([coming.id]);
    const search = (await mod.call('GET', '/admin/activities?q=thi%C3%A9bou')).json();
    expect(search.total).toBe(1);

    const chat = (await mod.call('GET', `/admin/activities/${coming.id}/messages`)).json();
    expect(chat.items.map((m: { body: string }) => m.body)).toContain('Salut tout le monde');
    const log = await t.db.select().from(adminAudit);
    expect(log.map((l) => l.action).sort()).toEqual(['activity.messages.view', 'session.open']);

    const cancel = await mod.call('POST', `/admin/activities/${coming.id}/cancel`, {
      reason: 'Arnaque signalée',
    });
    const detail = adminActivityDetailSchema.parse(cancel.json());
    expect(detail).toMatchObject({ status: 'cancelled', participantCount: 2, messageCount: 1 });
    expect(detail.participants.find((p) => p.isCreator)?.id).toBe(moussa.id);
    // Les participants le voient comme une annulation ordinaire.
    expect((await awa.call('GET', `/activities/${coming.id}`)).json().status).toBe('cancelled');

    const again = await mod.call('POST', `/admin/activities/${coming.id}/cancel`, {
      reason: 'Encore',
    });
    expect(again.json().error.code).toBe('conflict');
  });
});

describe('statistiques', () => {
  it('totaux et série par jour sur la période', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);
    await awa.call('POST', '/reports', { targetType: 'activity', targetId: id, reason: 'fake' });

    const stats = adminStatsSchema.parse((await mod.call('GET', '/admin/stats?days=7')).json());
    expect(stats.series).toHaveLength(7);
    expect(stats.series.at(-1)).toMatchObject({
      date: '2026-10-07',
      signups: 3,
      joins: 1,
      reports: 1,
    });
    expect(stats.totals).toMatchObject({
      members: 3,
      newMembers: 3,
      activitiesUpcoming: 1,
      joins: 1,
      openReports: 1,
    });
    expect(stats.categories).toEqual([{ category: 'sport', count: 1 }]);
    expect((await mod.call('GET', '/admin/stats?days=12')).statusCode).toBe(400);
  });
});

describe('journal de l’équipe', () => {
  it('réservé aux administrateurs, filtré par famille, cibles nommées', async () => {
    const admin = await staffMember('Moussa', 'admin');
    const mod = await staffMember('Khady', 'moderator');
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, awa.id, { title: 'Yoga à Ngor', startsAt: at(8) });
    await mod.call('POST', `/admin/users/${awa.id}/moderation`, {
      status: 'warned',
      reason: 'Ton',
    });
    await mod.call('GET', `/admin/activities/${id}/messages`);

    expect((await mod.call('GET', '/admin/audit')).statusCode).toBe(403);

    const all = pageOf(auditEntrySchema).parse((await admin.call('GET', '/admin/audit')).json());
    expect(all.total).toBe(4);
    const decisions = pageOf(auditEntrySchema).parse(
      (await admin.call('GET', '/admin/audit?kind=decisions')).json(),
    );
    expect(decisions.items).toMatchObject([
      {
        action: 'user.warned',
        actor: { id: mod.id, firstName: 'Khady' },
        targetLabel: 'Awa',
        details: { reason: 'Ton' },
      },
    ]);
    const reads = pageOf(auditEntrySchema).parse(
      (await admin.call('GET', '/admin/audit?kind=reads')).json(),
    );
    expect(reads.items).toMatchObject([
      { action: 'activity.messages.view', targetLabel: 'Yoga à Ngor' },
    ]);
    const logins = pageOf(auditEntrySchema).parse(
      (await admin.call('GET', '/admin/audit?kind=logins')).json(),
    );
    expect(logins.items.map((l) => l.targetLabel).sort()).toEqual(['Khady', 'Moussa']);
  });
});

describe('admin en direct', () => {
  it('le compteur de signalements arrive dès qu’il change, réservé à l’équipe', async () => {
    const mod = await staffMember('Khady', 'moderator');
    const awa = await createMember(t, 'Awa');
    const fatou = await createMember(t, 'Fatou');
    const address = await t.app.listen({ port: 0, host: '127.0.0.1' });

    const anonymous = await fetch(`${address}/admin/events`);
    expect(anonymous.status).toBe(401);

    const controller = new AbortController();
    const res = await fetch(`${address}/admin/events`, {
      headers: { cookie: mod.cookie },
      signal: controller.signal,
    });
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const nextCount = async () => {
      for (;;) {
        const match = /event: reports\ndata: (\{.*\})\n\n/.exec(buffer);
        if (match) {
          buffer = buffer.slice(match.index + match[0].length);
          return (JSON.parse(match[1]!) as { open: number }).open;
        }
        const { value } = await reader.read();
        buffer += decoder.decode(value, { stream: true });
      }
    };

    expect(await nextCount()).toBe(0);
    await awa.call('POST', '/reports', { targetType: 'user', targetId: fatou.id, reason: 'spam' });
    expect(await nextCount()).toBe(1);
    controller.abort();
  });
});
