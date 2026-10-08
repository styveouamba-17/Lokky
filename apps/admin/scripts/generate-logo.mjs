// Génère public/logo.svg (symbole Lokky sur sa tuile) à partir de la géométrie de l'app
// mobile : une seule source pour le logo (apps/mobile/src/ui/logo/geometry.ts).
import { writeFileSync } from 'node:fs';
import {
  LOGO_COLORS,
  LOGO_GAP,
  LOGO_SHAPES,
  LOGO_TILE_RADIUS,
} from '../../mobile/src/ui/logo/geometry.ts';

const shape = (s, attrs) =>
  s.kind === 'circle'
    ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" ${attrs}/>`
    : `<path d="${s.d}" ${attrs}/>`;

const gap = `fill="${LOGO_COLORS.tile}" stroke="${LOGO_COLORS.tile}" stroke-width="${LOGO_GAP * 2}" stroke-linejoin="round"`;
const body = LOGO_SHAPES.map((s) => shape(s, gap) + shape(s, `fill="${LOGO_COLORS[s.fill]}"`)).join(
  '',
);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${LOGO_TILE_RADIUS}" fill="${LOGO_COLORS.tile}"/>${body}</svg>\n`;
writeFileSync(new URL('../public/logo.svg', import.meta.url), svg);
console.log('public/logo.svg généré');
