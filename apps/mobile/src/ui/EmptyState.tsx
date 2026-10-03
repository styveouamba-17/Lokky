import type { ReactNode } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { makeStyles, motion } from '@/theme';
import { Button } from './Button';
import { Illustration, type IllustrationName } from './Illustration';
import { Text } from './Text';

export function EmptyState({
  title,
  description,
  illustration,
  artwork,
  action,
}: {
  title: string;
  description?: string;
  illustration?: ReactNode;
  // Illustration peinte (docs/illustrations.md) ; tant qu'elle manque, `illustration` s'affiche.
  artwork?: IllustrationName;
  action?: { label: string; onPress: () => void };
}) {
  const styles = useStyles();
  return (
    <Animated.View entering={FadeIn.duration(motion.slow)} style={styles.container}>
      {artwork ? (
        <Illustration name={artwork} fallback={illustration} style={styles.artwork} />
      ) : (
        illustration
      )}
      <Text variant="heading" align="center">
        {title}
      </Text>
      {description ? (
        <Text color="textMuted" align="center">
          {description}
        </Text>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} /> : null}
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
    padding: t.spacing.xxl,
  },
  artwork: { maxWidth: 280, marginBottom: t.spacing.sm },
}));
