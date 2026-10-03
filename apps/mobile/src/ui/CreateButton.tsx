import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';

const SIZE = 56;

// Bouton rond « Créer » au centre de la barre d'onglets (spec §6.2, coins `full`).
// Couleur action (et non brand) : l'icône garde un contraste suffisant dans les deux thèmes.
export function CreateButton({
  onPress,
  accessibilityLabel,
}: {
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.slot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Plus size={28} color={colors.onAction} weight="bold" />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: {
    width: SIZE,
    height: SIZE,
    marginTop: -t.spacing.xl,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.action,
    borderWidth: 4,
    borderColor: t.colors.surface,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
}));
