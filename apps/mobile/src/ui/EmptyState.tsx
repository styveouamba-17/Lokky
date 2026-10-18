import { useId, type ReactNode } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { makeStyles, motion, useTheme } from '@/theme';
import { Button } from './Button';
import { Illustration, type IllustrationName } from './Illustration';
import { Text } from './Text';

export function EmptyState({
  title,
  description,
  illustration,
  artwork,
  artworkFadeBottom = false,
  action,
}: {
  title: string;
  description?: string;
  illustration?: ReactNode;
  // Illustration peinte (docs/illustrations.md) ; tant qu'elle manque, `illustration` s'affiche.
  artwork?: IllustrationName;
  artworkFadeBottom?: boolean;
  action?: { label: string; onPress: () => void };
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const fadeId = `empty-state-fade-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <Animated.View entering={FadeIn.duration(motion.slow)} style={styles.container}>
      {artwork ? (
        <View style={styles.artworkFrame}>
          <Illustration name={artwork} fallback={illustration} />
          {artworkFadeBottom ? (
            <Svg
              testID="empty-state-artwork-fade"
              pointerEvents="none"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              style={styles.artworkFade}
            >
              <Defs>
                <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.bg} stopOpacity="0" />
                  <Stop offset="1" stopColor={colors.bg} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect width="100" height="40" fill={`url(#${fadeId})`} />
            </Svg>
          ) : null}
        </View>
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
  artworkFrame: { width: '100%', maxWidth: 280, marginBottom: t.spacing.sm },
  artworkFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 72,
  },
}));
