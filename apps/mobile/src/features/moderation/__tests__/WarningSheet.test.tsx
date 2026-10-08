import type { Me } from '@lokky/shared';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { useSessionStore } from '@/state/session';
import { useWarningsStore } from '@/state/warnings';
import { renderWithQuery } from '@/test/mockApi';
import { WarningSheet } from '../components/WarningSheet';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const TOKENS = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };
const me = (status: string, warnedAt: string | null) =>
  ({
    id: 'u_awa',
    firstName: 'Awa',
    moderation: { status, suspendedUntil: null, warnedAt },
  }) as Me;
const signedIn = (profile: Me) =>
  useSessionStore.setState({
    status: 'signedIn',
    tokens: TOKENS,
    me: profile,
    firstNameHint: null,
  });

const TITLE = 'Avertissement de l’équipe Lokky';

describe('WarningSheet', () => {
  beforeEach(() => useWarningsStore.setState({ seen: {} }));

  it('un avertissement s’affiche une fois, puis plus après « J’ai compris »', async () => {
    signedIn(me('warned', '2026-10-04T10:00:00.000Z'));
    await renderWithQuery(<WarningSheet />);
    expect(screen.getByRole('header', { name: TITLE })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'J’ai compris' }));
    expect(screen.queryByRole('header', { name: TITLE })).not.toBeOnTheScreen();
    expect(useWarningsStore.getState().seen).toEqual({ u_awa: '2026-10-04T10:00:00.000Z' });
  });

  it('un nouvel avertissement (en direct) réapparaît', async () => {
    useWarningsStore.setState({ seen: { u_awa: '2026-10-01T10:00:00.000Z' } });
    signedIn(me('warned', '2026-10-01T10:00:00.000Z'));
    await renderWithQuery(<WarningSheet />);
    expect(screen.queryByRole('header', { name: TITLE })).not.toBeOnTheScreen();
    await act(async () => signedIn(me('warned', '2026-10-04T10:00:00.000Z')));
    expect(screen.getByRole('header', { name: TITLE })).toBeOnTheScreen();
  });

  it('rien pour un compte actif, même averti autrefois', async () => {
    signedIn(me('active', '2026-10-01T10:00:00.000Z'));
    await renderWithQuery(<WarningSheet />);
    expect(screen.queryByRole('header', { name: TITLE })).not.toBeOnTheScreen();
  });
});
