// Convertit les couvertures peintes (assets/activities-paints/<id>.png, sources en pleine
// qualité) en WebP légers pour l'app (assets/covers/<id>.webp).
// Usage : npm run covers (depuis apps/mobile). Relancer après avoir ajouté ou retouché une
// source ; le nom du fichier doit être un identifiant de ACTIVITY_COVERS (packages/shared).
import { readdirSync, mkdirSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SOURCES = fileURLToPath(new URL('../assets/activities-paints/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../assets/covers/', import.meta.url));
// Assez pour un écran de détail en pleine largeur (≈ 400 pt × 3).
const MAX_WIDTH = 1200;

mkdirSync(OUTPUT, { recursive: true });
const files = readdirSync(SOURCES).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
for (const file of files) {
  const id = basename(file, extname(file));
  const { size } = await sharp(SOURCES + file)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(`${OUTPUT}${id}.webp`);
  console.log(`${id}.webp  ${Math.round(size / 1024)} Ko`);
}
