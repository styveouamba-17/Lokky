import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { useSessionStore } from '@/state/session';
import { renderWithProviders } from '@/test/render';
import { verifyEmailCode } from '../api';
import { CodeScreen } from '../screens/CodeScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../api', () => ({ verifyEmailCode: jest.fn(), requestEmailCode: jest.fn() }));

const TOKENS = { accessToken: 'a1', refreshToken: 'r1', expiresIn: 900 };

function renderCode() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return renderWithProviders(
    <QueryClientProvider client={client}>
      <CodeScreen email="awa@exemple.com" />
    </QueryClientProvider>,
  );
}

describe('CodeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ status: 'signedOut', tokens: null, me: null });
  });

  it('rappelle l’email et le code de démo en mode mock', async () => {
    await renderCode();
    expect(
      screen.getByText('On a envoyé un code à 6 chiffres à awa@exemple.com.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Mode démo : le code est 123456')).toBeOnTheScreen();
  });

  it('un code collé avec un espace est accepté et envoyé tout seul', async () => {
    jest.mocked(verifyEmailCode).mockResolvedValue({ tokens: TOKENS, user: null });
    await renderCode();
    await fireEvent.changeText(screen.getByLabelText('Code à 6 chiffres'), '123 456');
    await waitFor(() => expect(verifyEmailCode).toHaveBeenCalledWith('awa@exemple.com', '123456'));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('onboarding'));
  });

  it('un mauvais code affiche une erreur et vide les cases', async () => {
    jest
      .mocked(verifyEmailCode)
      .mockRejectedValue(new ApiError('validation', 'Code incorrect.', 400));
    await renderCode();
    await fireEvent.changeText(screen.getByLabelText('Code à 6 chiffres'), '000000');
    expect(await screen.findByText('Code incorrect. Vérifie et réessaie.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Code à 6 chiffres').props.value).toBe('');
  });

  it('le renvoi du code attend 30 secondes', async () => {
    await renderCode();
    expect(screen.getByRole('button', { name: /Renvoyer le code dans 30 s/ })).toBeDisabled();
  });
});
