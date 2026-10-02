import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { Button } from '../Button';

describe('Button', () => {
  it('déclenche onPress', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Je viens !" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Je viens !' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pendant le chargement : occupé, désactivé et sans texte', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Je viens !" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Je viens !' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(screen.queryByText('Je viens !')).toBeNull();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('désactivé : ne déclenche rien', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Publier" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Publier' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
