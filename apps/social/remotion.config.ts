import path from 'node:path';
import { Config } from '@remotion/cli/config';

// Une seule copie de React dans le bundle : celle de apps/social (19.2.3). Le monorepo a aussi
// react-dom 19.3 à la racine, incompatible avec react 19.2.3.
const local = (pkg: string) => path.resolve(process.cwd(), 'node_modules', pkg);
const root = (pkg: string) => path.resolve(process.cwd(), '..', '..', 'node_modules', pkg);

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      react: root('react'),
      'react-dom/client': local('react-dom/client.js'),
      'react-dom': local('react-dom'),
    },
  },
}));
