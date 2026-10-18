export const SITE_NAME = 'Lokky';

// Liens des stores et de l'app, utilisés par les pages de secours (lien de sortie partagé).
export const APP = {
  // Schéma de l'app (app.config.ts) : ouvre la sortie si Lokky est installée.
  scheme: 'lokky',
  androidPackage: 'com.nach17.lokky',
  iosAppId: 'com.nach17.Lokky',
} as const;

export const STORE_LINKS = {
  android: `https://play.google.com/store/apps/details?id=${APP.androidPackage}`,
  // À compléter avec l'identifiant numérique App Store Connect (https://apps.apple.com/app/id…).
  // Tant qu'il est vide, le bouton App Store n'est pas affiché.
  ios: '',
} as const;
