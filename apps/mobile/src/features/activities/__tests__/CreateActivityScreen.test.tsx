import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { makeTestClient, renderWithQuery, signInAs } from '@/test/mockApi';
import { createActivity } from '../api';
import { CreateActivityScreen } from '../screens/CreateActivityScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), replace: jest.fn() } }));
jest.mock('../api', () => ({ createActivity: jest.fn() }));

const continueButton = () => screen.getByRole('button', { name: 'Continuer' });

describe('CreateActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { client, me } = makeTestClient();
    signInAs(me);
    jest
      .mocked(createActivity)
      .mockImplementation((input) => client.request('activities.create', input));
  });

  it('parcours complet : 5 étapes, récapitulatif, publication', async () => {
    await renderWithQuery(<CreateActivityScreen />);

    // Quoi ?
    expect(continueButton()).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Plage' }));
    await fireEvent.changeText(screen.getByLabelText('Titre'), 'Baignade entre potes');
    await fireEvent.press(continueButton());

    // Quand ? « Demain » choisit aussi une heure en soirée.
    await screen.findByRole('header', { name: 'Quand ?' });
    await fireEvent.press(screen.getByRole('button', { name: 'Demain' }));
    await fireEvent.press(continueButton());

    // Où ? Un lieu populaire remplit le nom et le quartier.
    await screen.findByRole('header', { name: 'Où ?' });
    await fireEvent.press(screen.getByRole('button', { name: 'Plage de Ngor' }));
    expect(screen.getByLabelText('Nom du lieu').props.value).toBe('Plage de Ngor');
    await fireEvent.press(continueButton());

    // Combien ? 6 par défaut, on ajoute une place.
    await screen.findByRole('header', { name: 'Combien ?' });
    await fireEvent.press(screen.getByRole('button', { name: 'Une place de plus' }));
    expect(screen.getByText('7 personnes')).toBeOnTheScreen();
    await fireEvent.press(continueButton());

    // Coût : chacun paie sa part, avec une estimation.
    await screen.findByRole('header', { name: 'Combien ça coûte ?' });
    await fireEvent.press(screen.getByRole('radio', { name: /Chacun paie sa part/ }));
    await fireEvent.changeText(
      screen.getByLabelText('Estimation par personne (facultatif)'),
      '2 000',
    );
    await fireEvent.press(continueButton());

    // Récapitulatif puis publication.
    await screen.findByRole('header', { name: 'Récapitulatif' });
    expect(screen.getByText('Baignade entre potes')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Publier' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Baignade entre potes',
        category: 'beach',
        capacity: 7,
        cost: { type: 'split', estimateFcfa: 2000 },
        location: expect.objectContaining({ name: 'Plage de Ngor', neighborhood: 'ngor' }),
      }),
    );
    expect(await screen.findByText('C’est en ligne ! Nanu dem !')).toBeOnTheScreen();
  });

  it('« Modifier » depuis le récapitulatif ramène à l’étape', async () => {
    await renderWithQuery(<CreateActivityScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sport' }));
    await fireEvent.changeText(screen.getByLabelText('Titre'), 'Foot du soir');
    await fireEvent.press(continueButton());
    await fireEvent.press(await screen.findByRole('button', { name: 'Demain' }));
    await fireEvent.press(continueButton());
    await fireEvent.press(await screen.findByRole('button', { name: 'Corniche Ouest' }));
    for (let i = 0; i < 3; i += 1) await fireEvent.press(continueButton());
    await screen.findByRole('header', { name: 'Récapitulatif' });
    await fireEvent.press(screen.getByRole('button', { name: 'Modifier : Places' }));
    expect(await screen.findByRole('header', { name: 'Combien ?' })).toBeOnTheScreen();
  });

  it('sans rien remplir, la croix ferme directement', async () => {
    await renderWithQuery(<CreateActivityScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));
    expect(router.back).toHaveBeenCalled();
  });
});
