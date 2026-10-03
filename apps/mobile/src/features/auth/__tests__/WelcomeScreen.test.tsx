import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { WelcomeScreen } from '../screens/WelcomeScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

describe('WelcomeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('présente les 3 slides et indique la position', async () => {
    await renderWithProviders(<WelcomeScreen />);
    expect(screen.getByRole('header', { name: 'Tu fais quoi ce soir ?' })).toBeOnTheScreen();
    expect(screen.getByText('Viens, même si tu ne connais personne')).toBeOnTheScreen();
    expect(screen.getByText('Gratuit, ou chacun paie sa part')).toBeOnTheScreen();
    expect(screen.getByLabelText('Écran 1 sur 3')).toBeOnTheScreen();
  });

  it('« Suivant » avance, puis « Nanu dem ! » mène à la connexion', async () => {
    await renderWithProviders(<WelcomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByLabelText('Écran 2 sur 3')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.queryByRole('button', { name: 'Passer' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Nanu dem !' }));
    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('« Passer » mène directement à la connexion', async () => {
    await renderWithProviders(<WelcomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Passer' }));
    expect(router.push).toHaveBeenCalledWith('/login');
  });
});
