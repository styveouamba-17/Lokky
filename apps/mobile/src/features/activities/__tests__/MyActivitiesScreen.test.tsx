import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { makeTestClient, renderWithQuery, signInAs } from '@/test/mockApi';
import { createReview, declareAttendance, getParticipants, listMyActivities } from '../api';
import { MyActivitiesScreen } from '../screens/MyActivitiesScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock('../api', () => ({
  listMyActivities: jest.fn(),
  createReview: jest.fn(),
  declareAttendance: jest.fn(),
  getParticipants: jest.fn(),
}));

let client: ReturnType<typeof makeTestClient>['client'];

describe('MyActivitiesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const test = makeTestClient();
    client = test.client;
    signInAs(test.me);
    jest
      .mocked(listMyActivities)
      .mockImplementation((scope, cursor) => client.request('activities.mine', { scope, cursor }));
    jest
      .mocked(createReview)
      .mockImplementation((input) => client.request('reviews.create', input));
    jest
      .mocked(declareAttendance)
      .mockImplementation((input) => client.request('activities.attendance', input));
    jest
      .mocked(getParticipants)
      .mockImplementation((id) => client.request('activities.participants', { id }));
  });

  it('à venir par défaut, puis les autres onglets', async () => {
    await renderWithQuery(<MyActivitiesScreen />);
    expect(await screen.findByText('Révisions de partiels à la BU')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'À venir' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Créées par moi' }));
    expect(await screen.findByText('Thé à la Corniche')).toBeOnTheScreen();
    expect(screen.getByText('Thieb entre potes')).toBeOnTheScreen();
  });

  it('passées : laisser un avis au créateur, puis le remerciement', async () => {
    await renderWithQuery(<MyActivitiesScreen />);
    await fireEvent.press(await screen.findByRole('tab', { name: 'Passées' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Laisser un avis' }));

    const send = screen.getByRole('button', { name: 'Envoyer mon avis' });
    expect(send).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: '4 étoiles' }));
    expect(screen.getByText('Très bien')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Un mot pour Moussa (facultatif)'), 'Top !');
    await fireEvent.press(send);

    expect(await screen.findByText('Ton avis aide toute la communauté.')).toBeOnTheScreen();
    expect(createReview).toHaveBeenCalledWith({
      activityId: 'a_footing',
      creatorRating: 4,
      comment: 'Top !',
    });
    // Avis laissé : le bouton disparaît de la liste.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Laisser un avis' })).toBeNull(),
    );
  });

  it('créées : le créateur indique qui est venu', async () => {
    await renderWithQuery(<MyActivitiesScreen />);
    await fireEvent.press(await screen.findByRole('tab', { name: 'Créées par moi' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Qui est venu ?' }));

    const ibrahima = await screen.findByRole('checkbox', { name: 'Ibrahima' });
    expect(ibrahima).toBeChecked();
    await fireEvent.press(ibrahima);
    expect(screen.getByRole('checkbox', { name: 'Ibrahima' })).not.toBeChecked();
    await fireEvent.press(screen.getByRole('button', { name: 'Valider' }));

    expect(await screen.findByText('Merci, c’est noté !')).toBeOnTheScreen();
    expect(declareAttendance).toHaveBeenCalledWith({
      activityId: 'a_the',
      attendance: [
        { userId: 'u_mariama', attended: true },
        { userId: 'u_ibrahima', attended: false },
      ],
    });
  });

  it('onglet vide : invite à créer une sortie', async () => {
    jest.mocked(listMyActivities).mockResolvedValue({ items: [], nextCursor: null });
    await renderWithQuery(<MyActivitiesScreen />);
    await fireEvent.press(await screen.findByRole('tab', { name: 'Créées par moi' }));
    expect(await screen.findByText('Tu n’as encore rien organisé')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Créer une activité' })).toBeOnTheScreen();
  });
});
