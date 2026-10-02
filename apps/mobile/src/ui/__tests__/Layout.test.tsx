import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithProviders } from '@/test/render';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { ScreenHeader } from '../ScreenHeader';
import { Skeleton } from '../Skeleton';
import { Stepper } from '../Stepper';

describe('Card', () => {
  it('devient un bouton quand elle est cliquable', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Card onPress={onPress} accessibilityLabel="Foot à la plage">
        <Text>contenu</Text>
      </Card>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Foot à la plage' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('affiche le message et déclenche l’action', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <EmptyState
        title="Aucune activité ce soir…"
        description="et si tu en créais une ?"
        action={{ label: 'Créer une activité', onPress }}
      />,
    );
    expect(screen.getByText('Aucune activité ce soir…')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Créer une activité' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ScreenHeader', () => {
  it('affiche un titre et un bouton retour accessible', async () => {
    const onBack = jest.fn();
    await renderWithProviders(<ScreenHeader title="Détail" onBack={onBack} />);
    expect(screen.getByRole('header', { name: 'Détail' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('Stepper', () => {
  it('annonce l’étape courante', async () => {
    await renderWithProviders(<Stepper step={2} total={5} />);
    expect(screen.getByLabelText('Étape 2 sur 5')).toBeOnTheScreen();
  });
  it('borne une étape hors limites', async () => {
    await renderWithProviders(<Stepper step={9} total={5} />);
    expect(screen.getByLabelText('Étape 5 sur 5')).toBeOnTheScreen();
  });
});

describe('Skeleton', () => {
  it('est masqué aux lecteurs d’écran', async () => {
    await renderWithProviders(<Skeleton height={20} />);
    expect(screen.getByTestId('skeleton', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('skeleton')).toBeNull();
  });
});
