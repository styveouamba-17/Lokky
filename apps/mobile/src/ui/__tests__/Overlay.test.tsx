import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithProviders } from '@/test/render';
import { Sheet } from '../Sheet';
import { useToast } from '../Toast';

describe('Sheet', () => {
  it('affiche son contenu et se ferme en touchant le fond', async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <Sheet visible onClose={onClose} title="Signaler">
        <Text>Choisis un motif</Text>
      </Sheet>,
    );
    expect(screen.getByRole('header', { name: 'Signaler' })).toBeOnTheScreen();
    expect(screen.getByText('Choisis un motif')).toBeOnTheScreen();
    // Le fond est masqué aux lecteurs d'écran (feuille modale) : on le cherche parmi les éléments cachés.
    await fireEvent.press(
      screen.getByRole('button', { name: 'Fermer', includeHiddenElements: true }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se ferme avec le geste d’échappement des lecteurs d’écran', async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <Sheet visible onClose={onClose} title="Signaler">
        <Text>Choisis un motif</Text>
      </Sheet>,
    );
    await fireEvent(screen.getByTestId('sheet'), 'accessibilityEscape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ne rend rien quand elle est fermée', async () => {
    await renderWithProviders(
      <Sheet visible={false} onClose={() => {}}>
        <Text>caché</Text>
      </Sheet>,
    );
    expect(screen.queryByText('caché')).toBeNull();
  });
});

function ToastTrigger() {
  const toast = useToast();
  return (
    <Text accessibilityRole="button" onPress={() => toast.show('Activité complète', 'error')}>
      déclencher
    </Text>
  );
}

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('affiche un message puis le retire après 3,5 s', async () => {
    await renderWithProviders(<ToastTrigger />);
    await fireEvent.press(screen.getByText('déclencher'));
    expect(screen.getByRole('alert')).toHaveTextContent('Activité complète');
    await act(async () => {
      jest.advanceTimersByTime(3500);
    });
    expect(screen.queryByText('Activité complète')).toBeNull();
  });

  it('échoue clairement hors du fournisseur', async () => {
    function Orphan() {
      useToast();
      return null;
    }
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Orphan />)).rejects.toThrow(/ToastProvider/);
    jest.restoreAllMocks();
  });
});
