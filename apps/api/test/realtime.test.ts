import type { ClientToServerEvents, ServerToClientEvents } from '@lokky/shared';
import type { AddressInfo } from 'node:net';
import { io as connect, type Socket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { sessions } from '../src/db/schema';
import { attachRealtime, type RealtimeServer } from '../src/realtime';
import { createActivity, createMember } from './factories';
import { createTestApp, resetDatabase } from './helpers';

const NOW = new Date('2026-10-07T10:00:00Z');
const at = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000);

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

let t: Awaited<ReturnType<typeof createTestApp>>;
let ioServer: RealtimeServer;
let url = '';
const clients: Client[] = [];

// Le contrat partagé valide les dates avec l'horloge réelle : on la fige sur NOW.
beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  t = await createTestApp({ now: () => NOW });
  ioServer = attachRealtime(t.app.server, {
    db: t.db,
    services: t.services,
    events: t.app.events,
    now: () => NOW,
    sessionRecheckMs: 200,
  });
  await t.app.listen({ port: 0, host: '127.0.0.1' });
  url = `http://127.0.0.1:${(t.app.server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  await ioServer.close();
  await t.close();
  vi.useRealTimers();
});
beforeEach(() => resetDatabase(t.db));
afterEach(() => {
  for (const c of clients.splice(0)) c.disconnect();
});

function open(token: string): Promise<Client> {
  const socket: Client = connect(url, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
  });
  clients.push(socket);
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

const next = <E extends keyof ServerToClientEvents>(socket: Client, event: E) =>
  new Promise<Parameters<ServerToClientEvents[E]>[0]>((resolve) => {
    socket.once(event, ((payload: Parameters<ServerToClientEvents[E]>[0]) =>
      resolve(payload)) as never);
  });

const closedByServer = (socket: Client) =>
  new Promise<string>((resolve) => socket.on('disconnect', (reason) => resolve(reason)));

describe('temps réel', () => {
  it('refuse une connexion sans jeton valide', async () => {
    await expect(open('faux')).rejects.toThrow('unauthorized');
  });

  it('se déconnecter coupe le temps réel de ce téléphone', async () => {
    const awa = await createMember(t, 'Awa');
    const socket = await open(awa.token);
    const closed = closedByServer(socket);
    await awa.call('POST', '/auth/logout', { refreshToken: awa.refreshToken });
    expect(await closed).toBe('io server disconnect');
  });

  it('compte supprimé : ses connexions sont coupées', async () => {
    const awa = await createMember(t, 'Awa');
    const socket = await open(awa.token);
    const closed = closedByServer(socket);
    await awa.call('DELETE', '/me');
    expect(await closed).toBe('io server disconnect');
  });

  it('connexion révoquée ailleurs : coupée à la revérification suivante', async () => {
    const awa = await createMember(t, 'Awa');
    const socket = await open(awa.token);
    const closed = closedByServer(socket);
    await t.db.update(sessions).set({ revokedAt: NOW }).where(eq(sessions.userId, awa.id));
    expect(await closed).toBe('io server disconnect');
  });

  it('un message arrive chez les membres', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);

    const socket = await open(moussa.token);
    const received = next(socket, 'message:new');
    await awa.call('POST', `/conversations/${conversationId}/messages`, {
      clientId: 'client-rt1',
      body: 'Salut le groupe !',
    });
    expect(await received).toMatchObject({
      body: 'Salut le groupe !',
      sender: { firstName: 'Awa' },
    });
  });

  it('un message modifié est mis à jour en temps réel chez les membres', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);
    const created = await awa.call('POST', `/conversations/${conversationId}/messages`, {
      clientId: 'client-edit-realtime',
      body: 'Je serai là à 18h.',
    });

    const socket = await open(moussa.token);
    const received = next(socket, 'message:updated');
    await awa.call('PATCH', `/messages/${created.json().id}`, { body: 'Je serai là à 18h30.' });
    expect(await received).toMatchObject({
      id: created.json().id,
      body: 'Je serai là à 18h30.',
      editedAt: expect.any(String),
    });
  });

  it('« Je viens ! » : le créateur voit le message système en direct', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id } = await createActivity(t, moussa.id, { startsAt: at(8) });
    const socket = await open(moussa.token);
    const received = next(socket, 'message:new');
    await awa.call('POST', `/activities/${id}/join`);
    expect(await received).toMatchObject({ type: 'system', body: 'Awa a rejoint le groupe' });
  });

  it('saisie relayée aux autres membres seulement', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const { id, conversationId } = await createActivity(t, moussa.id, { startsAt: at(8) });
    await awa.call('POST', `/activities/${id}/join`);
    const awaSocket = await open(awa.token);
    const moussaSocket = await open(moussa.token);
    const typing = next(moussaSocket, 'typing');
    awaSocket.emit('typing', { conversationId, isTyping: true });
    expect(await typing).toMatchObject({
      conversationId,
      isTyping: true,
      user: { firstName: 'Awa' },
    });
  });

  it('sortie annulée : les participants sont prévenus', async () => {
    const moussa = await createMember(t, 'Moussa');
    const awa = await createMember(t, 'Awa');
    const created = await moussa.call('POST', '/activities', {
      title: 'Ciné en plein air',
      category: 'cinema',
      startsAt: at(26).toISOString(),
      location: {
        name: 'Corniche Ouest',
        coordinates: { lat: 14.693, lng: -17.475 },
        neighborhood: 'fann',
        meetingPoint: null,
      },
      capacity: 6,
      cost: { type: 'free' },
    });
    const { id } = created.json();
    await awa.call('POST', `/activities/${id}/join`);
    const socket = await open(awa.token);
    const cancelled = next(socket, 'activity:cancelled');
    await moussa.call('POST', `/activities/${id}/cancel`);
    expect(await cancelled).toEqual({ activityId: id });
  });
});
