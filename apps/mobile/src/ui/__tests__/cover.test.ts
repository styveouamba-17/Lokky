import { ACTIVITY_COVERS } from '@lokky/shared';
import { COVER_IMAGES } from '@/assets/illustrations';
import { activityCover, coverChoices } from '../Illustration';

describe('couvertures d’activité', () => {
  it('chaque couverture du contrat a son image dans l’app', () => {
    expect(Object.keys(COVER_IMAGES).sort()).toEqual([...ACTIVITY_COVERS].sort());
  });

  it('utilise l’image choisie par le créateur', () => {
    expect(activityCover({ id: 'a1', category: 'food', cover: 'karting' })).toBe(
      COVER_IMAGES.karting,
    );
  });

  it('automatique : une image de la catégorie, toujours la même pour une sortie', () => {
    const cover = activityCover({ id: 'a1', category: 'beach', cover: null });
    expect(cover?.auto && cover.categories).toContain('beach');
    expect(activityCover({ id: 'a1', category: 'beach' })).toBe(cover);
  });

  it('image inconnue de cette version : retombe sur l’automatique', () => {
    expect(activityCover({ id: 'a1', category: 'beach', cover: 'future-cover' })).toBe(
      activityCover({ id: 'a1', category: 'beach', cover: null }),
    );
  });

  it('catégorie sans image automatique : pas de couverture', () => {
    expect(activityCover({ id: 'a1', category: 'study', cover: null })).toBeNull();
  });

  it('galerie : les images de la catégorie d’abord, puis toutes les autres', () => {
    const { suggested, others } = coverChoices('sport');
    expect(suggested).toEqual(expect.arrayContaining(['karting', 'padel', 'tennis']));
    expect(others).toContain('concert');
    expect([...suggested, ...others].sort()).toEqual([...ACTIVITY_COVERS].sort());
  });
});
