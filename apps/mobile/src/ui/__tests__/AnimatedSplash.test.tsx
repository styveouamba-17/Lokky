import { act, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { AnimatedSplash } from '../AnimatedSplash';
import { contrastRatio, palette } from '@/theme';
import { LOGO_COLORS } from '../logo/geometry';

describe('AnimatedSplash', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('affiche le logo puis prévient quand l’animation est finie', async () => {
    const onFinish = jest.fn();
    await renderWithProviders(<AnimatedSplash onFinish={onFinish} />);
    expect(screen.getByTestId('animated-splash')).toBeOnTheScreen();
    expect(screen.getByText('Lokky')).toBeOnTheScreen();

    await act(() => jest.advanceTimersByTime(1000));
    expect(onFinish).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(1000));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('le nom « Lokky » reste lisible sur le fond orange (AA grand texte)', () => {
    expect(contrastRatio(palette.charbon, LOGO_COLORS.tile)).toBeGreaterThanOrEqual(4.5);
  });
});
