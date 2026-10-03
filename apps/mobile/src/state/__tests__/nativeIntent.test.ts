import { redirectForLink, usePendingLink } from '../pendingLink';

describe('liens entrants', () => {
  beforeEach(() => usePendingLink.setState({ activityId: null }));

  it('un lien vers une sortie passe par l’accueil et garde la sortie à ouvrir', () => {
    expect(redirectForLink('https://lokky.akylian.com/activity/a_foot')).toBe('/');
    expect(usePendingLink.getState().activityId).toBe('a_foot');
  });

  it('les autres liens passent tels quels', () => {
    expect(redirectForLink('/settings')).toBe('/settings');
    expect(usePendingLink.getState().activityId).toBeNull();
  });
});
