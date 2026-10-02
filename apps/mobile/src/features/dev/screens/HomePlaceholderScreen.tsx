import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from '@/theme';
import { Button, LokkyLogo, Text } from '@/ui';

// Accueil provisoire du jalon 1, remplacé par l'écran Bienvenue au jalon 2.
export function HomePlaceholderScreen() {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <LokkyLogo size={56} />
        <Text variant="title" align="center">
          Tu fais quoi ce soir ?
        </Text>
        <Text color="textMuted" align="center">
          La nouvelle version de Lokky se construit ici.
        </Text>
        {__DEV__ ? (
          <Button label="Voir le design system" onPress={() => router.push('/dev/ui')} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.lg,
    padding: t.spacing.screen,
  },
}));
