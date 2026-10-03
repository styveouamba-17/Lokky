import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithQuery } from '@/test/mockApi';
import { createReport } from '../api';
import { ReportScreen } from '../screens/ReportScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('../api', () => ({ createReport: jest.fn() }));

describe('ReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createReport).mockResolvedValue({ ok: true });
  });

  it('choisir un motif, puis envoyer', async () => {
    await renderWithQuery(<ReportScreen targetType="message" targetId="m_1" />);
    expect(screen.getByText(/signaler ce message/)).toBeOnTheScreen();
    const submit = screen.getByRole('button', { name: 'Envoyer le signalement' });
    expect(submit).toBeDisabled();

    await fireEvent.press(screen.getByRole('radio', { name: 'Harcèlement ou menaces' }));
    await fireEvent.press(submit);
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(createReport).toHaveBeenCalledWith({
      targetType: 'message',
      targetId: 'm_1',
      reason: 'harassment',
      details: undefined,
    });
    expect(
      await screen.findByText('Merci. L’équipe Lokky va examiner ton signalement.'),
    ).toBeOnTheScreen();
  });

  it('« Autre chose » demande quelques mots avant d’envoyer', async () => {
    await renderWithQuery(<ReportScreen targetType="user" targetId="u_1" />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Autre chose' }));
    const submit = screen.getByRole('button', { name: 'Envoyer le signalement' });
    expect(submit).toBeDisabled();
    await fireEvent.changeText(
      screen.getByLabelText('Dis-nous en plus'),
      'Il insiste pour avoir mon numéro.',
    );
    expect(submit).toBeEnabled();
  });
});
