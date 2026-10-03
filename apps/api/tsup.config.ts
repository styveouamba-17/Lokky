import { defineConfig } from 'tsup';

// Un seul fichier JS par point d'entrée. @lokky/shared (TypeScript sans build) est inclus
// dans le paquet ; les autres dépendances restent dans node_modules.
export default defineConfig({
  entry: ['src/main.ts', 'src/worker.ts', 'src/db/migrate.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@lokky/shared'],
});
