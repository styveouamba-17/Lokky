import { router } from 'expo-router';
import { CircleHalf } from 'phosphor-react-native/src/icons/CircleHalf';
import { Moon } from 'phosphor-react-native/src/icons/Moon';
import { Sun } from 'phosphor-react-native/src/icons/Sun';
import { Translate } from 'phosphor-react-native/src/icons/Translate';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { usePreferencesStore, type LanguagePreference } from '@/state/preferences';
import { useSessionStore } from '@/state/session';
import { makeStyles, type ThemePreference } from '@/theme';
import { OptionCard, ScreenHeader, Text, type IconComponent } from '@/ui';
import { useUpdatePreferences } from '../hooks/useUpdatePreferences';

const THEMES: { value: ThemePreference; icon: IconComponent }[] = [
  { value: 'system', icon: CircleHalf },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
];

const LANGUAGES: readonly LanguagePreference[] = ['fr', 'en'];

// Thème et langue : appliqués tout de suite (gardés sur le téléphone) et suivis par le
// compte (le serveur pourra écrire les notifications dans la bonne langue).
export function AppearanceScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const theme = usePreferencesStore((s) => s.themePreference);
  const setTheme = usePreferencesStore((s) => s.setThemePreference);
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const preferences = useSessionStore((s) => s.me?.preferences);
  const update = useUpdatePreferences();

  const chooseTheme = (value: ThemePreference) => {
    setTheme(value);
    // Au mieux : le thème local suffit à l'affichage, le compte suivra à la prochaine fois.
    if (preferences) update.mutate({ ...preferences, theme: value });
  };

  const chooseLanguage = (value: LanguagePreference) => {
    setLanguage(value);
    if (preferences) update.mutate({ ...preferences, language: value });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t('settings.look.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.group} accessibilityRole="radiogroup">
          <Text variant="label">{t('settings.look.theme')}</Text>
          {THEMES.map(({ value, icon }) => (
            <OptionCard
              key={value}
              icon={icon}
              title={t(`settings.look.${value}`)}
              selected={theme === value}
              onPress={() => chooseTheme(value)}
            />
          ))}
        </View>
        <View style={styles.group} accessibilityRole="radiogroup">
          <Text variant="label">{t('settings.look.language')}</Text>
          {LANGUAGES.map((value) => (
            <OptionCard
              key={value}
              icon={Translate}
              title={t(`settings.look.${value}`)}
              selected={language === value}
              onPress={() => chooseLanguage(value)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.screen, gap: t.spacing.xxl },
  group: { gap: t.spacing.sm },
}));
