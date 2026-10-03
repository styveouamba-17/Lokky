import { Redis } from 'ioredis';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createRedisRateLimiter, IP_POLICIES, USER_POLICIES } from '../src/http/rateLimit';
import { createActivity, createMember } from './factories';
import { TEST_REDIS_URL } from './env';
import { createTestApp, resetDatabase } from './helpers';

const NOW = new Date('2026-10-07T10:00:00Z');
const redis = new Redis(TEST_REDIS_URL);

async function clearCounters() {
  const keys = await redis.keys('rl:*');
  if (keys.length) await redis.del(...keys);
}

afterAll(async () => {
  await clearCounters();
  redis.disconnect();
});

describe('limitation de débit', () => {
  beforeEach(clearCounters);

  it('connexion : au-delà de la limite par adresse IP, 429 avec Retry-After', async () => {
    const t = await createTestApp({ now: () => NOW, rateLimiter: createRedisRateLimiter(redis) });
    const limit = IP_POLICIES['auth.emailStart']!.limit;
    try {
      for (let i = 0; i < limit; i += 1) {
        const res = await t.app.inject({
          method: 'POST',
          url: '/auth/email/start',
          payload: { email: `personne${i}@exemple.sn` },
        });
        expect(res.statusCode).toBe(200);
      }
      const blocked = await t.app.inject({
        method: 'POST',
        url: '/auth/email/start',
        payload: { email: 'encore@exemple.sn' },
      });
      expect(blocked.statusCode).toBe(429);
      expect(blocked.json().error.code).toBe('rate_limited');
      expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    } finally {
      await t.close();
    }
  });

  it('messages : limite par compte, les autres comptes ne sont pas touchés', async () => {
    const t = await createTestApp({ now: () => NOW, rateLimiter: createRedisRateLimiter(redis) });
    try {
      await resetDatabase(t.db);
      const moussa = await createMember(t, 'Moussa');
      const awa = await createMember(t, 'Awa');
      const { id, conversationId } = await createActivity(t, moussa.id, {
        startsAt: new Date(NOW.getTime() + 8 * 3_600_000),
      });
      await awa.call('POST', `/activities/${id}/join`);
      const limit = USER_POLICIES['messages.send']!.limit;
      const send = (who: typeof awa, i: number) =>
        who.call('POST', `/conversations/${conversationId}/messages`, {
          clientId: `client-limite-${who.firstName}-${i}`,
          body: `Message ${i}`,
        });
      for (let i = 0; i < limit; i += 1) expect((await send(awa, i)).statusCode).toBe(200);
      expect((await send(awa, limit)).statusCode).toBe(429);
      expect((await send(moussa, 0)).statusCode).toBe(200);
    } finally {
      await t.close();
    }
  });
});

describe('comptes et photos', () => {
  it('un compte supprimé perd l’accès tout de suite, même avec un jeton encore valide', async () => {
    const t = await createTestApp({ now: () => NOW });
    try {
      await resetDatabase(t.db);
      const awa = await createMember(t, 'Awa');
      expect((await awa.call('GET', '/me')).statusCode).toBe(200);
      await awa.call('DELETE', '/me');
      expect((await awa.call('GET', '/activities')).statusCode).toBe(401);
    } finally {
      await t.close();
    }
  });

  it('photo de plus de 2 Mo : refusée et supprimée du stockage', async () => {
    const t = await createTestApp({ now: () => NOW });
    try {
      await resetDatabase(t.db);
      const awa = await createMember(t, 'Awa');
      const { publicUrl } = (
        await awa.call('POST', '/me/avatar/upload-url', { contentType: 'image/jpeg' })
      ).json();
      t.markHeavy(publicUrl);
      const res = await awa.call('PATCH', '/me', { avatarUrl: publicUrl });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.message).toMatch(/2 Mo/);
      expect(t.removedAvatars).toEqual([publicUrl]);
    } finally {
      await t.close();
    }
  });
});
