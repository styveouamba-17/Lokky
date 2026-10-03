import { hrefForPush, isForOpenConversation } from '../routes';

describe('ouvrir une notification', () => {
  it('un message ouvre sa conversation', () => {
    expect(hrefForPush({ type: 'message', conversationId: 'c_a_foot' })).toEqual({
      pathname: '/chat/[id]',
      params: { id: 'c_a_foot' },
    });
  });

  it('tout ce qui concerne une sortie ouvre son détail', () => {
    for (const type of [
      'activity_joined',
      'activity_updated',
      'activity_cancelled',
      'activity_reminder',
      'after_activity',
    ]) {
      expect(hrefForPush({ type, activityId: 'a_foot' })).toEqual({
        pathname: '/activity/[id]',
        params: { id: 'a_foot' },
      });
    }
  });

  it('données inconnues : on ouvre juste l’app', () => {
    expect(hrefForPush({ type: 'promo' })).toBeNull();
    expect(hrefForPush(undefined)).toBeNull();
  });

  it('pas de bannière pour la conversation déjà à l’écran', () => {
    const data = { type: 'message', conversationId: 'c1' };
    expect(isForOpenConversation(data, 'c1')).toBe(true);
    expect(isForOpenConversation(data, 'c2')).toBe(false);
    expect(isForOpenConversation({ type: 'activity_reminder', activityId: 'a1' }, 'c1')).toBe(
      false,
    );
  });
});
