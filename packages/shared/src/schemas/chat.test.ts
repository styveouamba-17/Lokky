import { describe, expect, it } from 'vitest';
import { conversationSchema, sendMessageInputSchema } from './chat';

const base = { conversationId: 'c1', clientId: 'client-123456' };

describe('envoi de message', () => {
  it('nettoie les espaces autour du message', () => {
    expect(sendMessageInputSchema.parse({ ...base, body: '  Salut !  ' }).body).toBe('Salut !');
  });
  it('refuse un message composé uniquement d’espaces', () => {
    expect(sendMessageInputSchema.safeParse({ ...base, body: '   \n  ' }).success).toBe(false);
  });
  it('refuse un message de plus de 2000 caractères', () => {
    expect(sendMessageInputSchema.safeParse({ ...base, body: 'a'.repeat(2001) }).success).toBe(
      false,
    );
  });
});

describe('conversation', () => {
  const conv = {
    id: 'c1',
    type: 'group',
    activityId: 'a1',
    title: 'Foot à la plage',
    avatarUrl: null,
    lastMessage: null,
    unreadCount: 0,
    isReadOnly: false,
    updatedAt: '2026-10-07T10:00:00Z',
  };
  it('accepte une conversation de groupe liée à une activité', () => {
    expect(conversationSchema.safeParse(conv).success).toBe(true);
  });
  it('refuse un groupe sans activité', () => {
    expect(conversationSchema.safeParse({ ...conv, activityId: null }).success).toBe(false);
  });
  it('refuse une conversation privée liée à une activité', () => {
    expect(conversationSchema.safeParse({ ...conv, type: 'direct' }).success).toBe(false);
  });
});
