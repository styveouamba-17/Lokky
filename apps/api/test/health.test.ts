import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createTestApp } from './helpers';

describe('santé et base de données', () => {
  it('/health : base et Redis joignables', async () => {
    const { app, close } = await createTestApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, database: 'up', cache: 'up' });
    await close();
  });

  it('les migrations ont activé PostGIS et citext', async () => {
    const { db, close } = await createTestApp();
    const rows = await db.execute<{ extname: string }>(
      sql`select extname from pg_extension where extname in ('postgis', 'citext') order by 1`,
    );
    expect(rows.map((r) => r.extname)).toEqual(['citext', 'postgis']);
    // Distance PostGIS : Plateau → Ngor, une douzaine de kilomètres.
    const [distance] = await db.execute<{ km: string }>(
      sql`select round((ST_Distance(
        ST_MakePoint(-17.433, 14.668)::geography,
        ST_MakePoint(-17.513, 14.747)::geography
      ) / 1000)::numeric) as km`,
    );
    expect(Number(distance?.km)).toBe(12);
    await close();
  });
});
