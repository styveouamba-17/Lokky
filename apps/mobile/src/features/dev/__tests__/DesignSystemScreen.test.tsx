import { fireEvent, screen } from '@testing-library/react-native';
import { usePreferencesStore } from '@/state/preferences';
import { renderWithProviders } from '@/test/render';
import { DesignSystemScreen } from '../screens/DesignSystemScreen';

describe('DesignSystemScreen', () => {
  beforeEach(() => usePreferencesStore.setState({ themePreference: 'system' }));

  it('présente chaque famille de composants', async () => {
    await renderWithProviders(<DesignSystemScreen />);
    for (const section of [
      'Logo',
      'Couleurs',
      'Typographie',
      'Boutons',
      'Champs',
      'Puces et badges',
      'Avatars',
      'États',
    ]) {
      expect(screen.getByRole('header', { name: section })).toBeOnTheScreen();
    }
  });

  it('change la préférence de thème', async () => {
    await renderWithProviders(<DesignSystemScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sombre' }));
    expect(usePreferencesStore.getState().themePreference).toBe('dark');
  });

  it('ouvre la feuille du bas', async () => {
    await renderWithProviders(<DesignSystemScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Ouvrir une feuille' }));
    expect(screen.getByRole('header', { name: 'Signaler' })).toBeOnTheScreen();
  });
});
