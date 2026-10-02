const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const FEATURES = [
  'auth',
  'onboarding',
  'activities',
  'chat',
  'profile',
  'reviews',
  'moderation',
  'notifications',
  'settings',
  'dev',
];
const LAYERS =
  'Sens des dépendances : app → features → ui | api | lib | theme | state (spec §4.3).';
const zone = (target, from) => ({ target, from, message: LAYERS });

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*', 'coverage/*'] },
  {
    settings: { 'import/resolver': { typescript: { project: './tsconfig.json' } } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'phosphor-react-native',
              message:
                "Importer chaque icône séparément (phosphor-react-native/src/icons/<Nom>) : l'import global ajoute ~5 Mo au bundle.",
            },
          ],
        },
      ],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            zone('./src/ui', ['./src/features', './src/api', './src/state', './app']),
            zone('./src/theme', [
              './src/features',
              './src/ui',
              './src/api',
              './src/state',
              './app',
            ]),
            zone('./src/lib', [
              './src/features',
              './src/ui',
              './src/api',
              './src/theme',
              './src/state',
              './app',
            ]),
            zone('./src/api', ['./src/features', './src/ui', './src/state', './app']),
            zone('./src/state', ['./src/features', './src/ui', './src/api', './app']),
            zone('./src/features', './app'),
            ...FEATURES.map((feature) => ({
              target: `./src/features/${feature}`,
              from: './src/features',
              except: [`./${feature}`],
              message: 'Une feature n’importe pas une autre feature (spec §4.3).',
            })),
          ],
        },
      ],
    },
  },
]);
