import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { Badge } from '../Badge';
import { Chip } from '../Chip';

describe('Chip', () => {
  it('expose son état sélectionné et réagit à l’appui', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Chip label="Ce soir" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Ce soir' });
    expect(chip).toBeSelected();
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Badge', () => {
  it('affiche son libellé', async () => {
    await renderWithProviders(<Badge label="Gratuit" tone="free" />);
    expect(screen.getByText('Gratuit')).toBeOnTheScreen();
  });
});
