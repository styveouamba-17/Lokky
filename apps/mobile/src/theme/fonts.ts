import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';

// true quand les polices sont prêtes, ou en échec (on continue alors avec les polices système).
export function useLokkyFonts(): boolean {
  const [loaded, error] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  return loaded || error !== null;
}
