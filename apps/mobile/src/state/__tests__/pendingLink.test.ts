import { activityIdFromLink } from '../pendingLink';

describe('liens vers une sortie', () => {
  it('reconnaît le lien web, le schéma de l’app et un chemin', () => {
    expect(activityIdFromLink('https://lokky.akylian.com/activity/a_foot')).toBe('a_foot');
    expect(activityIdFromLink('lokky://activity/a_foot?ref=whatsapp')).toBe('a_foot');
    expect(activityIdFromLink('/activity/a_foot')).toBe('a_foot');
  });
  it('ignore les autres liens', () => {
    expect(activityIdFromLink('https://lokky.akylian.com/conditions')).toBeNull();
    expect(activityIdFromLink('n’importe quoi')).toBeNull();
  });
});
