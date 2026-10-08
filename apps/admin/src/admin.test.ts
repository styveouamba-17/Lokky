import type { AdminUserRow, Staff } from '@lokky/shared/admin';
import { describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api/client';
import { availableActions } from './features/users/ModerationDialog';
import { formatRelative } from './lib/format';

const json = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('client de l’API admin', () => {
  it('envoie l’en-tête anti-CSRF, la requête et valide la réponse', async () => {
    const fetcher = json(200, { updated: 2 });
    const out = await api('admin.reports.resolve', { id: 'r1', status: 'resolved' }, fetcher);
    expect(out).toEqual({ updated: 2 });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/admin/reports/r1/resolve');
    expect(init.headers).toMatchObject({ 'x-lokky-admin': '1' });
    expect(JSON.parse(String(init.body))).toEqual({ status: 'resolved' });
  });

  it('met les filtres dans l’URL des listes', async () => {
    const fetcher = json(200, { items: [], total: 0, page: 2, pageSize: 25 });
    await api('admin.users.list', { q: 'awa', filter: 'banned', page: 2 }, fetcher);
    expect((fetcher.mock.calls[0] as unknown as [string])[0]).toBe(
      '/api/admin/users?q=awa&filter=banned&page=2',
    );
  });

  it('transforme les erreurs du contrat en ApiError', async () => {
    const fetcher = json(401, { error: { code: 'unauthorized', message: 'Session expirée.' } });
    await expect(api('admin.me', {}, fetcher)).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
      message: 'Session expirée.',
    });
    await expect(api('admin.me', {}, json(200, { nope: true }))).rejects.toBeInstanceOf(ApiError);
  });
});

describe('décisions proposées', () => {
  const mod: Staff = { id: 's1', email: 'k@lokky.sn', firstName: 'Khady', role: 'moderator' };
  const admin: Staff = { ...mod, id: 's2', role: 'admin' };
  const user = (
    status: AdminUserRow['moderation']['status'],
    role: Staff['role'] | null = null,
  ) => ({
    id: 'u1',
    role,
    moderation: { status, suspendedUntil: null },
  });

  it('un modérateur ne bannit pas et ne touche ni à l’équipe ni à un banni', () => {
    expect(availableActions(user('active'), mod)).toEqual(['warned', 'suspended']);
    expect(availableActions(user('banned'), mod)).toEqual([]);
    expect(availableActions(user('warned'), mod)).toEqual(['warned', 'suspended', 'active']);
    expect(availableActions(user('active', 'moderator'), mod)).toEqual([]);
  });

  it('un administrateur peut bannir et lever un bannissement, jamais se modérer', () => {
    expect(availableActions(user('suspended'), admin)).toEqual(['warned', 'banned', 'active']);
    expect(availableActions(user('banned'), admin)).toEqual(['active']);
    expect(availableActions({ ...user('active'), id: admin.id }, admin)).toEqual([]);
  });
});

describe('dates', () => {
  it('relatives, en français', () => {
    const now = new Date('2026-10-07T10:00:00Z');
    expect(formatRelative('2026-10-07T07:00:00Z', now)).toBe('il y a 3 heures');
    expect(formatRelative('2026-10-09T10:00:00Z', now)).toBe('après-demain');
    expect(formatRelative('2026-10-07T09:59:40Z', now)).toBe('à l’instant');
  });
});
