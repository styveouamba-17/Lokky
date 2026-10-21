export const SITE_NAME = 'Lokky';

// Liens des stores et de l'app, utilisés par les pages de secours (lien de sortie partagé).
export const APP = {
  // Schéma de l'app (app.config.ts) : ouvre la sortie si Lokky est installée.
  scheme: 'lokky',
  androidPackage: 'com.nach17.lokky',
  iosAppId: 'com.nach17.Lokky',
} as const;

export const STORE_LINKS = {
  android: `https://play.google.com/store/apps/details?id=${APP.androidPackage}&hl=en_US`,
  ios: 'https://apps.apple.com/sn/app/lokky/id6761419238',
} as const;
