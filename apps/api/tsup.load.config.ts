import { defineConfig } from 'tsup';

// Test de charge compilé en JavaScript, pour tourner dans un conteneur Linux (npm run load:docker).
export default defineConfig({
  entry: { load: 'load/run.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  outDir: 'dist-load',
  clean: true,
  noExternal: ['@lokky/shared'],
  // Les autres paquets restent dans node_modules (pas de regroupement).
  skipNodeModulesBundle: true,
});
