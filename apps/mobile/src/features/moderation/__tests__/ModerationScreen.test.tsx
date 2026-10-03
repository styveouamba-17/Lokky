import type { Me } from '@lokky/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useSessionStore } from '@/state/session';
import { renderWithQuery } from '@/test/mockApi';
import { getMe } from '../api';
import { ModerationScreen } from '../screens/ModerationScreen';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../api', () => ({ getMe: jest.fn() }));

const TOKENS = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };
const me = (status: string, suspendedUntil: string | null) =>
  ({ id: 'u_awa', firstName: 'Awa', moderation: { status, suspendedUntil } }) as Me;

describe('ModerationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({
      status: 'suspended',
      tokens: TOKENS,
      me: me('suspended', '2099-10-12T18:00:00Z'),
      firstNameHint: null,
    });
  });

  it('suspendu : date de fin, explication et sortie possible', async () => {
    await renderWithQuery(<ModerationScreen kind="suspended" />);
    expect(screen.getByRole('header', { name: 'Ton compte est suspendu' })).toBeOnTheScreen();
    expect(screen.getByText('Jusqu’au 12 oct. 2099 à 18h.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Se déconnecter' }));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('signedOut'));
  });

  it('suspension levée : « Vérifier à nouveau » rouvre l’app', async () => {
    jest.mocked(getMe).mockResolvedValue(me('active', null));
    await renderWithQuery(<ModerationScreen kind="suspended" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Vérifier à nouveau' }));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('signedIn'));
  });

  it('toujours suspendu : on le dit clairement', async () => {
    jest.mocked(getMe).mockResolvedValue(me('suspended', '2099-10-12T18:00:00Z'));
    await renderWithQuery(<ModerationScreen kind="suspended" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Vérifier à nouveau' }));
    expect(await screen.findByText('Ton compte est toujours suspendu.')).toBeOnTheScreen();
  });

  it('banni : pas de vérification, seulement la déconnexion', async () => {
    useSessionStore.setState({ status: 'banned', me: me('banned', null) });
    await renderWithQuery(<ModerationScreen kind="banned" />);
    expect(screen.getByRole('header', { name: 'Ton compte a été fermé' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Vérifier à nouveau' })).toBeNull();
  });
});
