import type { Me } from '@lokky/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useSessionStore } from '@/state/session';
import { renderWithProviders } from '@/test/render';
import { completeOnboarding, setAvatarUrl, uploadAvatar } from '../api';
import { pickAvatar } from '../avatar';
import { OnboardingScreen } from '../screens/OnboardingScreen';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../api', () => ({
  completeOnboarding: jest.fn(),
  uploadAvatar: jest.fn(),
  setAvatarUrl: jest.fn(),
}));
jest.mock('../avatar', () => ({ pickAvatar: jest.fn() }));
jest.mock('../permissions', () => ({
  getPermission: jest.fn(async () => 'undetermined'),
  requestPermission: jest.fn(async () => 'granted'),
}));
// Le sélecteur natif est remplacé par une saisie directe de la date ISO.
jest.mock('../components/BirthDateField', () => {
  const { TextInput } = jest.requireActual('react-native');
  return {
    BirthDateField: ({ value, onChange, error }: Record<string, never>) => (
      <>
        <TextInput
          accessibilityLabel="Ta date de naissance"
          value={value}
          onChangeText={onChange}
        />
        {error ? <TextInput value={error} editable={false} /> : null}
      </>
    ),
  };
});

const TOKENS = { accessToken: 'a1', refreshToken: 'r1', expiresIn: 900 };
const continueButton = () => screen.getByRole('button', { name: 'Continuer' });

function renderOnboarding() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return renderWithProviders(
    <QueryClientProvider client={client}>
      <OnboardingScreen />
    </QueryClientProvider>,
  );
}

async function fillYou(birthDate: string) {
  await fireEvent.changeText(screen.getByLabelText('Ta date de naissance'), birthDate);
  await fireEvent.press(continueButton());
}

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({
      status: 'onboarding',
      tokens: TOKENS,
      me: null,
      firstNameHint: 'Awa',
    });
  });

  it('préremplit le prénom reçu d’Apple ou Google et permet d’ajouter une photo', async () => {
    await renderOnboarding();
    expect(screen.getByLabelText('Ton prénom').props.value).toBe('Awa');
    expect(screen.getByRole('button', { name: 'Ajouter une photo' })).toBeOnTheScreen();
    expect(continueButton()).toBeDisabled(); // date de naissance manquante
  });

  it('refuse les moins de 18 ans', async () => {
    await renderOnboarding();
    await fillYou('2015-06-01');
    expect(
      await screen.findByDisplayValue('Lokky est réservé aux 18 ans et plus.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Faisons connaissance' })).toBeOnTheScreen();
  });

  it('parcours complet : profil envoyé, session connectée', async () => {
    jest.mocked(pickAvatar).mockResolvedValue('file:///avatar.jpg');
    jest.mocked(uploadAvatar).mockResolvedValue('https://avatars.test/avatar.jpg');
    jest.mocked(completeOnboarding).mockResolvedValue({
      id: 'u_awa',
      firstName: 'Awa',
      moderation: { status: 'active', suspendedUntil: null, warnedAt: null },
    } as Me);
    jest.mocked(setAvatarUrl).mockResolvedValue({
      id: 'u_awa',
      firstName: 'Awa',
      avatarUrl: 'https://avatars.test/avatar.jpg',
      moderation: { status: 'active', suspendedUntil: null, warnedAt: null },
    } as Me);
    await renderOnboarding();
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter une photo' }));
    await waitFor(() => expect(screen.getByTestId('avatar-image')).toBeOnTheScreen());
    await fillYou('2003-04-10');

    await screen.findByRole('header', { name: 'Ta situation' });
    await fireEvent.press(screen.getByRole('radio', { name: /Étudiant·e/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fann' }));
    await fireEvent.press(continueButton());

    await screen.findByRole('header', { name: 'Tes envies' });
    for (const name of [/Plage/, /Ciné/, /Musique/]) {
      await fireEvent.press(screen.getByRole('button', { name }));
    }
    expect(screen.getByText('3 sur 3 minimum')).toBeOnTheScreen();
    await fireEvent.press(continueButton());

    await screen.findByRole('header', { name: 'Dernière étape' });
    await fireEvent.press(screen.getAllByRole('button', { name: 'Autoriser' })[0]!);
    expect(await screen.findByText('Activée')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'C’est parti !' }));

    await waitFor(() => expect(useSessionStore.getState().status).toBe('signedIn'));
    expect(completeOnboarding).toHaveBeenCalledWith({
      firstName: 'Awa',
      birthDate: '2003-04-10',
      status: 'student',
      neighborhood: 'fann',
      interests: ['beach', 'cinema', 'music'],
    });
    expect(uploadAvatar).toHaveBeenCalledWith('file:///avatar.jpg');
    expect(setAvatarUrl).toHaveBeenCalledWith('https://avatars.test/avatar.jpg');
  });

  it('photo non envoyée : le profil est quand même validé, avec un message', async () => {
    jest.mocked(pickAvatar).mockResolvedValue('file:///avatar.jpg');
    jest.mocked(uploadAvatar).mockRejectedValue(new Error('R2 indisponible'));
    jest.mocked(completeOnboarding).mockResolvedValue({
      id: 'u_awa',
      firstName: 'Awa',
      moderation: { status: 'active', suspendedUntil: null, warnedAt: null },
    } as Me);
    await renderOnboarding();
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter une photo' }));
    await waitFor(() => expect(screen.getByTestId('avatar-image')).toBeOnTheScreen());
    await fillYou('2003-04-10');
    await screen.findByRole('header', { name: 'Ta situation' });
    await fireEvent.press(screen.getByRole('radio', { name: /Étudiant·e/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fann' }));
    await fireEvent.press(continueButton());
    await screen.findByRole('header', { name: 'Tes envies' });
    for (const name of [/Plage/, /Ciné/, /Musique/]) {
      await fireEvent.press(screen.getByRole('button', { name }));
    }
    await fireEvent.press(continueButton());
    await screen.findByRole('header', { name: 'Dernière étape' });
    await fireEvent.press(screen.getByRole('button', { name: 'C’est parti !' }));

    await waitFor(() => expect(useSessionStore.getState().status).toBe('signedIn'));
    expect(setAvatarUrl).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        'Ton profil est créé, mais la photo n’a pas pu être envoyée. Ajoute-la depuis ton profil.',
      ),
    ).toBeOnTheScreen();
  });

  it('revenir en arrière à la 1re étape ramène à la connexion', async () => {
    await renderOnboarding();
    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('signedOut'));
  });
});
