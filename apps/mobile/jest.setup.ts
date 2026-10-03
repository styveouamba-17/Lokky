import { setUpTests } from 'react-native-reanimated';
import '@/i18n';

setUpTests();

jest.mock(
  'react-native-safe-area-context',
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-safe-area-context/jest/mock').default,
);

// FlashList mesure sa mise en page en natif : sans cela, Jest n'affiche aucun élément.
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = jest.requireActual('react-native');
  return { FlashList: FlatList };
});
