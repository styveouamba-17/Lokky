import { View } from 'react-native';
import { makeStyles } from '@/theme';

export function Stepper({ step, total }: { step: number; total: number }) {
  const styles = useStyles();
  const safeTotal = Math.max(1, Math.floor(total));
  const current = Math.min(Math.max(1, Math.floor(step)), safeTotal);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Étape ${current} sur ${safeTotal}`}
      accessibilityValue={{ min: 1, max: safeTotal, now: current }}
      style={styles.row}
    >
      {Array.from({ length: safeTotal }, (_, i) => (
        <View key={i} style={[styles.segment, i < current && styles.done]} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: t.colors.border },
  done: { backgroundColor: t.colors.action },
}));
