import { describe, expect, it } from 'vitest';
import { pushDataSchema } from './push';

describe('données des notifications', () => {
  it('accepte un nouveau message avec sa conversation', () => {
    expect(pushDataSchema.safeParse({ type: 'message', conversationId: 'c1' }).success).toBe(true);
  });
  it('refuse un rappel sans activité', () => {
    expect(pushDataSchema.safeParse({ type: 'activity_reminder' }).success).toBe(false);
  });
  it('refuse un type inconnu', () => {
    expect(pushDataSchema.safeParse({ type: 'promo', activityId: 'a1' }).success).toBe(false);
  });
});
