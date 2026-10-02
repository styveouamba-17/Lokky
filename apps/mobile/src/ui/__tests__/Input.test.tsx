import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { Input } from '../Input';
import { TextArea } from '../TextArea';

describe('Input', () => {
  it('est accessible par son libellé', async () => {
    await renderWithProviders(<Input label="Prénom" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Prénom')).toBeOnTheScreen();
  });

  it('affiche l’erreur à la place de l’aide', async () => {
    await renderWithProviders(
      <Input label="Prénom" value="A" hint="Visible par tous" error="Trop court" />,
    );
    expect(screen.getByText('Trop court')).toBeOnTheScreen();
    expect(screen.queryByText('Visible par tous')).toBeNull();
  });
});

describe('TextArea', () => {
  it('affiche le compteur de caractères', async () => {
    await renderWithProviders(
      <TextArea label="Description" value="Salut la team" maxLength={500} />,
    );
    expect(screen.getByText('13/500')).toBeOnTheScreen();
  });
});
