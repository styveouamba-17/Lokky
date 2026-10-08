import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { makeTestClient, renderWithQuery, signInAs } from '@/test/mockApi';
import { getActivity, updateActivity } from '../api';
import { EditActivityScreen } from '../screens/EditActivityScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('../api', () => ({
  getActivity: jest.fn(),
  updateActivity: jest.fn(),
}));

describe('EditActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { client, me } = makeTestClient();
    signInAs(me);
    jest.mocked(getActivity).mockImplementation((id) => client.request('activities.get', { id }));
    jest
      .mocked(updateActivity)
      .mockImplementation((input) => client.request('activities.update', input));
  });

  it('charge les valeurs existantes et enregistre une modification', async () => {
    await renderWithQuery(<EditActivityScreen id="a_thieb" />);
    const description = await screen.findByLabelText('Le programme (facultatif)');
    await fireEvent.changeText(description, 'Thieb entre amis');

    for (let step = 0; step < 4; step += 1) {
      await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
    }
    await screen.findByRole('header', { name: 'Récapitulatif' });
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(updateActivity).toHaveBeenCalledWith({
      id: 'a_thieb',
      description: 'Thieb entre amis',
    });
    expect(await screen.findByText('Les modifications sont enregistrées.')).toBeOnTheScreen();
  });

  it('permet de changer le jour, l’heure et la capacité quand il reste plus d’une heure', async () => {
    await renderWithQuery(<EditActivityScreen id="a_thieb" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Continuer' }));
    expect(await screen.findByRole('header', { name: 'Quand ?' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Demain' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    await screen.findByRole('header', { name: 'Où ?' });
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
    expect(await screen.findByRole('header', { name: 'Combien ?' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Une place de plus' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
    await screen.findByRole('header', { name: 'Récapitulatif' });
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(updateActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'a_thieb',
        capacity: 7,
        startsAt: expect.any(String),
      }),
    );
    const update = jest.mocked(updateActivity).mock.calls[0]?.[0];
    expect(update?.startsAt).not.toBe('2026-10-12T13:00:00.000Z');
  });
});
