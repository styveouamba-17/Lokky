import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { contrastRatio } from '@/theme';
import { AVATAR_TONES, Avatar, avatarTone, initials } from '../Avatar';
import { AvatarStack } from '../AvatarStack';

const people = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `u${i}`, name: `Personne ${i}`, uri: null }));

describe('Avatar', () => {
  it('affiche l’initiale quand il n’y a pas de photo', async () => {
    await renderWithProviders(<Avatar name="awa" uri={null} />);
    expect(screen.getByText('A')).toBeOnTheScreen();
    expect(screen.getByLabelText('awa')).toBeOnTheScreen();
  });

  it('affiche la photo quand elle existe', async () => {
    await renderWithProviders(<Avatar name="Awa" uri="https://exemple.sn/awa.jpg" />);
    expect(screen.getByTestId('avatar-image')).toBeOnTheScreen();
  });

  it('gère un prénom vide', () => {
    expect(initials('   ')).toBe('?');
  });

  it('donne toujours la même couleur au même prénom', () => {
    expect(avatarTone('Moussa')).toBe(avatarTone('Moussa'));
  });

  it.each(AVATAR_TONES.map((t) => [t.fg, t.bg]))('initiale %s sur %s lisible', (fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('AvatarStack', () => {
  it('limite les avatars affichés et indique le reste', async () => {
    await renderWithProviders(<AvatarStack people={people(7)} max={4} />);
    expect(screen.getByText('+3')).toBeOnTheScreen();
    expect(screen.getByLabelText('7 participants')).toBeOnTheScreen();
  });

  it('calcule le reste à partir du total réel, pas de l’aperçu', async () => {
    await renderWithProviders(<AvatarStack people={people(5)} total={12} max={4} />);
    expect(screen.getByText('+8')).toBeOnTheScreen();
  });

  it('n’affiche pas de reste quand tout le monde tient', async () => {
    await renderWithProviders(<AvatarStack people={people(1)} />);
    expect(screen.queryByText(/^\+/)).toBeNull();
    expect(screen.getByLabelText('1 participant')).toBeOnTheScreen();
  });
});
