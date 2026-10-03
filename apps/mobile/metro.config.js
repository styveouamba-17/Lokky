// Configuration Metro d'Expo, enrichie par Sentry (identifiants de débogage des source maps).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
