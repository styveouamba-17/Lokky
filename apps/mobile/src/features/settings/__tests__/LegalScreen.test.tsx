import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { LEGAL_DOCUMENTS, LegalScreen } from '../screens/LegalScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

describe('LegalScreen', () => {
  it('affiche les conditions : titre, date, sections et listes', async () => {
    await renderWithProviders(<LegalScreen document="terms" />);
    expect(screen.getByRole('header', { name: 'Conditions d’utilisation' })).toBeOnTheScreen();
    expect(screen.getByText('Dernière mise à jour : 3 octobre 2026')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: '4. Les règles de conduite' })).toBeOnTheScreen();
    expect(screen.getByText('Tu dois avoir 18 ans ou plus.')).toBeOnTheScreen();
  });

  it('affiche la politique de confidentialité', async () => {
    await renderWithProviders(<LegalScreen document="privacy" />);
    expect(screen.getByRole('header', { name: 'Politique de confidentialité' })).toBeOnTheScreen();
    expect(screen.getByText(/loi sénégalaise n° 2008-12/)).toBeOnTheScreen();
  });

  it('chaque document a des sections non vides', () => {
    for (const doc of [
      ...Object.values(LEGAL_DOCUMENTS.fr),
      ...Object.values(LEGAL_DOCUMENTS.en),
    ]) {
      expect(doc.sections.length).toBeGreaterThan(0);
      for (const section of doc.sections) expect(section.blocks.length).toBeGreaterThan(0);
    }
  });
});
