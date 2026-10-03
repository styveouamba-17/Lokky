import type { ExpoConfig } from 'expo/config';

// Toutes les permissions natives de la v1 sont déclarées dès maintenant, pour qu'un même
// build de développement serve jusqu'au jalon 8 (spec §7.4 : localisation pendant
// l'utilisation seulement, avatar comme seule image, push via Expo).
const LOCATION_TEXT =
  'Lokky utilise ta position pendant que tu utilises l’app pour te proposer des sorties près de toi.';
const CAMERA_TEXT = 'Lokky utilise ta caméra pour ta photo de profil.';
const PHOTOS_TEXT = 'Lokky accède à tes photos pour ta photo de profil.';

const config: ExpoConfig = {
  name: 'Lokky',
  slug: 'Frontend', // slug historique du projet EAS : ne pas changer
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'lokky',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.nach17.Lokky',
    supportsTablet: false,
    googleServicesFile: './GoogleService-Info.plist',
    associatedDomains: ['applinks:lokky.akylian.com'],
    usesAppleSignIn: true,
    appleTeamId: '7UZ7GPX6A4',
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'com.nach17.lokky',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      monochromeImage: './assets/monochrome-icon.png',
      backgroundColor: '#FF6B3D',
    },
    // Les plugins ajoutent localisation, caméra et notifications. On bloque ce que la v1
    // n'utilise pas, au cas où une dépendance l'ajouterait.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.READ_CALENDAR',
      'android.permission.WRITE_CALENDAR',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'lokky.akylian.com', pathPrefix: '/activity' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-localization',
    'expo-web-browser',
    'expo-apple-authentication',
    '@react-native-google-signin/google-signin', // sans options : lit les fichiers Firebase
    '@react-native-community/datetimepicker',
    [
      'expo-splash-screen',
      {
        // Doit rester aligné sur src/ui/AnimatedSplash.tsx (SPLASH_MARK_SIZE, fond orange).
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FF6B3D',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#FF6B3D' },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_TEXT,
        locationAlwaysAndWhenInUsePermission: LOCATION_TEXT,
        locationAlwaysPermission: LOCATION_TEXT,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-image-picker',
      { photosPermission: PHOTOS_TEXT, cameraPermission: CAMERA_TEXT, microphonePermission: false },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#FF6B3D',
        defaultChannel: 'default',
      },
    ],
    // Organisation et projet Sentry à renseigner au jalon 8. D'ici là, l'envoi des source
    // maps est désactivé dans eas.json (SENTRY_DISABLE_AUTO_UPLOAD).
    '@sentry/react-native/expo',
  ],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: '7c688313-8128-4e0f-b8be-9766c1a6d9a5' } },
  runtimeVersion: { policy: 'appVersion' },
  updates: { url: 'https://u.expo.dev/7c688313-8128-4e0f-b8be-9766c1a6d9a5' },
};

export default config;
