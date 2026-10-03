// Génère les icônes natives et l'image du splash à partir de src/ui/logo/geometry.ts.
// Usage : npm run brand:assets (depuis apps/mobile). Relancer après toute retouche du logo,
// puis refaire un build natif (les icônes ne passent pas par les mises à jour OTA).
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  LOGO_COLORS,
  LOGO_GAP,
  LOGO_SHAPES,
  LOGO_TILE_RADIUS,
  isPersonShape,
} from '../src/ui/logo/geometry.ts';

const ASSETS = fileURLToPath(new URL('../assets/', import.meta.url));
const CENTER = { x: 32, y: 32.2 }; // centre visuel du symbole

const shapeEl = (s, attrs) =>
  s.kind === 'circle'
    ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" ${attrs}/>`
    : `<path d="${s.d}" ${attrs}/>`;
const gapAttrs = (color) =>
  `fill="${color}" stroke="${color}" stroke-width="${LOGO_GAP * 2}" stroke-linejoin="round"`;

// Couleurs : chaque forme est précédée de son liseré, peint dans la couleur du fond.
function colored(shapes, gapColor) {
  return shapes
    .map((s) => shapeEl(s, gapAttrs(gapColor)) + shapeEl(s, `fill="${LOGO_COLORS[s.fill]}"`))
    .join('');
}

// Une seule couleur : les liserés deviennent transparents (masques).
function mono(shapes, color) {
  return shapes
    .map((s, i) => {
      const above = shapes
        .slice(i + 1)
        .map((o) => shapeEl(o, gapAttrs('#000')))
        .join('');
      return (
        `<mask id="m${i}" maskUnits="userSpaceOnUse" x="-100" y="-100" width="300" height="300">` +
        `<rect x="-100" y="-100" width="300" height="300" fill="#fff"/>${above}</mask>` +
        shapeEl(s, `fill="${color}" mask="url(#m${i})"`)
      );
    })
    .join('');
}

const svg = (size, body, background = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CENTER.x - size / 2} ${CENTER.y - size / 2} ${size} ${size}">${background}${body}</svg>`;
const fullBleed = `<rect x="-100" y="-100" width="300" height="300" fill="${LOGO_COLORS.tile}"/>`;

function write(name, content, px, dir = ASSETS) {
  const png = new Resvg(content, { fitTo: { mode: 'width', value: px } }).render().asPng();
  writeFileSync(dir + name, png);
  console.log(`✓ ${dir === ASSETS ? 'assets/' : dir}${name} (${px} px)`);
}

const all = LOGO_SHAPES;
const small = LOGO_SHAPES.filter((s) => !isPersonShape(s));

// iOS : carré plein sans transparence (iOS arrondit lui-même les coins).
write('icon.png', svg(70, colored(all, LOGO_COLORS.tile), fullBleed), 1024);
// Android adaptatif : premier plan dans la zone sûre (66 %), fond orange dans app.config.ts.
write('adaptive-icon.png', svg(96, colored(all, LOGO_COLORS.tile)), 1024);
// Android 13+ (icônes thématiques) : silhouette d'une seule couleur.
write('monochrome-icon.png', svg(96, mono(all, '#FFFFFF')), 1024);
// Splash natif : symbole seul, posé sur le fond orange défini dans app.config.ts.
write('splash-icon.png', svg(60, colored(all, LOGO_COLORS.tile)), 1024);
// Notification Android : blanc sur transparent, version réduite.
write('notification-icon.png', svg(60, mono(small, '#FFFFFF')), 96);

// Aperçu de la tuile arrondie, hors du projet : node … --preview <dossier/>
const previewIndex = process.argv.indexOf('--preview');
if (previewIndex !== -1) {
  const dir = process.argv[previewIndex + 1];
  const tile = `<rect x="0" y="0" width="64" height="64" rx="${LOGO_TILE_RADIUS}" fill="${LOGO_COLORS.tile}"/>`;
  write('logo-preview.png', svg(64, colored(all, LOGO_COLORS.tile), tile), 512, dir);
}
