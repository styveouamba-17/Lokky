// Géométrie du symbole « Coucher de Corniche » (spec §3), grille de 64 × 64.
// Source unique : le composant LokkyLogo, le splash animé et le script qui génère les
// icônes natives (scripts/generate-brand-assets.mjs) lisent tous ce fichier.
// Pas d'import ni d'alias ici : Node doit pouvoir le charger tel quel.

export type LogoPart =
  'sun' | 'personLeft' | 'personCenter' | 'personRight' | 'waveBack' | 'waveFront';
export type LogoFill = 'sun' | 'person' | 'wave';

export type LogoShape =
  | { part: LogoPart; fill: LogoFill; kind: 'circle'; cx: number; cy: number; r: number }
  | { part: LogoPart; fill: LogoFill; kind: 'path'; d: string };

export const LOGO_COLORS = {
  tile: '#FF6B3D', // palette.corniche
  sun: '#FFC857', // palette.soleil
  person: '#FAF9F6', // palette.sable
  wave: '#00B4A6', // palette.ocean
} as const;

// Chaque forme est entourée d'un liseré couleur du fond, qui la détache de celles du dessous.
export const LOGO_GAP = 1.8;
export const LOGO_TILE_RADIUS = 14;

// Ordre de dessin : du fond vers l'avant. Chaque personnage est contigu (corps puis tête)
// pour que le splash puisse l'animer comme un seul calque.
export const LOGO_SHAPES: readonly LogoShape[] = [
  { part: 'sun', fill: 'sun', kind: 'path', d: 'M11.6 33 A20.5 20.5 0 1 1 52.4 33 Z' },
  {
    part: 'personLeft',
    fill: 'person',
    kind: 'path',
    d: 'M12.6 42.5 C12.8 36.4 15.8 32.6 19.6 32.6 C22 32.6 23.8 33.6 25 35.2 L25 42.5 Z',
  },
  { part: 'personLeft', fill: 'person', kind: 'circle', cx: 21.2, cy: 28.6, r: 3.5 },
  {
    part: 'personRight',
    fill: 'person',
    kind: 'path',
    d: 'M51.4 44 C51.2 36.4 48.2 32.6 44.4 32.6 C42 32.6 40.2 33.6 39 35.2 L39 44 Z',
  },
  { part: 'personRight', fill: 'person', kind: 'circle', cx: 42.8, cy: 28.6, r: 3.5 },
  {
    part: 'personCenter',
    fill: 'person',
    kind: 'path',
    d: 'M24 43 L24 38.2 C24 33.8 27.4 30.8 32 30.8 C36.6 30.8 40 33.8 40 38.2 L40 43 Z',
  },
  { part: 'personCenter', fill: 'person', kind: 'circle', cx: 32, cy: 25.6, r: 4.3 },
  {
    part: 'waveBack',
    fill: 'wave',
    kind: 'path',
    d:
      'M14 47.4 C16.5 45.6 19 44.8 21.6 44.8 C26.5 44.8 30 48.4 35.5 49.2 C38.5 49.6 41.5 49.6 44.2 49.2 ' +
      'C45.4 49 45.8 50.2 44.8 50.8 C41.8 52.8 38.5 53.8 35 53.8 C29 53.8 25.5 48.6 21.6 48.6 ' +
      'C19.5 48.6 17.5 49 15.4 49.6 C14 50 13 48.3 14 47.4 Z',
  },
  {
    part: 'waveFront',
    fill: 'wave',
    kind: 'path',
    d:
      'M7 43.6 C10.5 40 15 38 19 38 C25 38 31 42.5 38.5 42.8 C46 43 51.5 40 55.6 37.6 ' +
      'C57.2 36.8 58.3 38.6 57.2 39.8 C52.5 45 46.5 48.4 39.5 48.4 C31 48.4 25.5 43 19.2 43 ' +
      'C15 43 11.5 44.5 8.6 46 C7.2 46.6 6 44.6 7 43.6 Z',
  },
];

// Version réduite (très petites tailles, icône de notification) : soleil et vagues seuls.
export const isPersonShape = (shape: LogoShape) => shape.fill === 'person';
