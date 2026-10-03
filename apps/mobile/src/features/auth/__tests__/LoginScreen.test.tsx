import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ApiError } from '@/api/errors';
import { useSessionStore } from '@/state/session';
import { renderWithProviders } from '@/test/render';
import { requestEmailCode, signInWithOAuth } from '../api';
import { signInWithGoogle } from '../providers';
import { LoginScreen } from '../screens/LoginScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../api', () => ({ requestEmailCode: jest.fn(), signInWithOAuth: jest.fn() }));
jest.mock('../providers', () => ({
  isAppleSignInAvailable: jest.fn(async () => false),
  signInWithApple: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

const TOKENS = { accessToken: 'a1', refreshToken: 'r1', expiresIn: 900 };
const GOOGLE_BUTTON = { name: 'Continuer avec Google' };

function renderLogin() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return renderWithProviders(
    <QueryClientProvider client={client}>
      <LoginScreen />
    </QueryClientProvider>,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ status: 'signedOut', tokens: null, me: null });
  });

  it('refuse un email invalide sans appeler l’API', async () => {
    await renderLogin();
    await fireEvent.changeText(screen.getByLabelText('Ton email'), 'awa@');
    await fireEvent.press(screen.getByRole('button', { name: 'Recevoir un code' }));
    expect(await screen.findByText('Cet email n’a pas l’air valide.')).toBeOnTheScreen();
    expect(requestEmailCode).not.toHaveBeenCalled();
  });

  it('envoie le code à l’email normalisé', async () => {
    jest.mocked(requestEmailCode).mockResolvedValue({ ok: true });
    await renderLogin();
    await fireEvent.changeText(screen.getByLabelText('Ton email'), '  Awa@Exemple.com ');
    await fireEvent.press(screen.getByRole('button', { name: 'Recevoir un code' }));
    await waitFor(() => expect(requestEmailCode).toHaveBeenCalledWith('awa@exemple.com'));
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/code',
        params: { email: 'awa@exemple.com' },
      }),
    );
  });

  it('Google, nouveau compte : session en onboarding, prénom gardé pour le préremplir', async () => {
    jest
      .mocked(signInWithGoogle)
      .mockResolvedValue({ provider: 'google', idToken: 'jeton', firstName: 'Awa' });
    jest.mocked(signInWithOAuth).mockResolvedValue({ tokens: TOKENS, user: null });
    await renderLogin();
    await fireEvent.press(screen.getByRole('button', GOOGLE_BUTTON));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('onboarding'));
    expect(useSessionStore.getState().firstNameHint).toBe('Awa');
    // La navigation est faite par la garde (app/_layout.tsx), pas par l'écran.
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('Google annulé : aucune erreur, on reste sur la page', async () => {
    jest.mocked(signInWithGoogle).mockResolvedValue(null);
    await renderLogin();
    await fireEvent.press(screen.getByRole('button', GOOGLE_BUTTON));
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalled());
    expect(signInWithOAuth).not.toHaveBeenCalled();
    expect(useSessionStore.getState().status).toBe('signedOut');
    expect(screen.queryByText(/a échoué/)).toBeNull();
  });

  it('affiche un message clair si le réseau tombe', async () => {
    jest.mocked(signInWithGoogle).mockResolvedValue({ provider: 'google', idToken: 'jeton' });
    jest.mocked(signInWithOAuth).mockRejectedValue(new ApiError('network', 'hors ligne'));
    await renderLogin();
    await fireEvent.press(screen.getByRole('button', GOOGLE_BUTTON));
    expect(
      await screen.findByText('Pas de connexion. Vérifie ton réseau et réessaie.'),
    ).toBeOnTheScreen();
  });

  it('propose l’email en repli si la fenêtre Google échoue', async () => {
    jest.mocked(signInWithGoogle).mockRejectedValue(new Error('DEVELOPER_ERROR'));
    await renderLogin();
    await fireEvent.press(screen.getByRole('button', GOOGLE_BUTTON));
    expect(
      await screen.findByText('La connexion avec Google a échoué. Réessaie, ou utilise ton email.'),
    ).toBeOnTheScreen();
  });
});
