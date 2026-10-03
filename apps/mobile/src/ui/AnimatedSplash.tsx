import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { palette } from '@/theme';
import { ColoredShapes } from './LokkyLogo';
import { Text } from './Text';
import { LOGO_COLORS, LOGO_SHAPES, type LogoPart } from './logo/geometry';

// Prend le relais du splash natif (même fond, même image, même taille : aucun saut), anime
// le symbole puis s'efface. La taille et le cadrage doivent rester alignés sur
// app.config.ts (imageWidth) et scripts/generate-brand-assets.mjs (splash-icon.png).
export const SPLASH_MARK_SIZE = 200;
const VIEW_BOX = '2 2.2 60 60'; // carré de 60 centré sur (32, 32.2), comme splash-icon.png
const DURATION_MS = 1900;
const REDUCED_DURATION_MS = 500;
const EXIT_MS = 300;

const ease = Easing.out(Easing.cubic);
const hop = (delay: number) =>
  withDelay(
    delay,
    withSequence(
      withTiming(-14, { duration: 170, easing: ease }),
      withSpring(0, { damping: 7, stiffness: 220 }),
    ),
  );
const sway = (delay: number, distance: number) =>
  withDelay(
    delay,
    withSequence(
      withTiming(distance, { duration: 450, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 450, easing: Easing.inOut(Easing.sin) }),
    ),
  );

function Layer({
  part,
  y,
  x,
}: {
  part: LogoPart;
  y?: SharedValue<number>;
  x?: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x?.value ?? 0 }, { translateY: y?.value ?? 0 }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={SPLASH_MARK_SIZE} height={SPLASH_MARK_SIZE} viewBox={VIEW_BOX}>
        <ColoredShapes shapes={LOGO_SHAPES.filter((s) => s.part === part)} />
      </Svg>
    </Animated.View>
  );
}

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const reduceMotion = useReducedMotion();
  const sunY = useSharedValue(0);
  const leftY = useSharedValue(0);
  const centerY = useSharedValue(0);
  const rightY = useSharedValue(0);
  const backX = useSharedValue(0);
  const frontX = useSharedValue(0);
  const wordmark = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const total = reduceMotion ? REDUCED_DURATION_MS : DURATION_MS;
    if (!reduceMotion) {
      sunY.value = withSequence(
        withTiming(-5, { duration: 420, easing: ease }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.cubic) }),
      );
      leftY.value = hop(120);
      centerY.value = hop(220);
      rightY.value = hop(320);
      backX.value = sway(0, -5);
      frontX.value = sway(80, 6);
      wordmark.value = withDelay(650, withTiming(1, { duration: 350, easing: ease }));
      scale.value = withDelay(total - EXIT_MS, withTiming(1.08, { duration: EXIT_MS }));
    }
    opacity.value = withDelay(total - EXIT_MS, withTiming(0, { duration: EXIT_MS }));
    const timer = setTimeout(onFinish, total);
    return () => clearTimeout(timer);
  }, [
    reduceMotion,
    onFinish,
    sunY,
    leftY,
    centerY,
    rightY,
    backX,
    frontX,
    wordmark,
    opacity,
    scale,
  ]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmark.value,
    transform: [{ translateY: (1 - wordmark.value) * 12 }],
  }));

  return (
    <Animated.View
      testID="animated-splash"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Lokky"
      pointerEvents="none"
      style={[styles.container, containerStyle]}
    >
      <Animated.View style={[styles.mark, markStyle]}>
        <Layer part="sun" y={sunY} />
        <Layer part="personLeft" y={leftY} />
        <Layer part="personRight" y={rightY} />
        <Layer part="personCenter" y={centerY} />
        <Layer part="waveBack" x={backX} />
        <Layer part="waveFront" x={frontX} />
      </Animated.View>
      <Animated.View style={[styles.wordmark, wordmarkStyle]}>
        <Text variant="display" maxFontSizeMultiplier={1} style={styles.wordmarkText}>
          Lokky
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Positions explicites : StyleSheet.absoluteFillObject n'existe plus en RN 0.86.
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LOGO_COLORS.tile,
  },
  mark: { width: SPLASH_MARK_SIZE, height: SPLASH_MARK_SIZE },
  // Positionné en absolu sous le symbole, pour que celui-ci reste au centre exact de l'écran.
  wordmark: { position: 'absolute', top: '50%', marginTop: SPLASH_MARK_SIZE / 2 + 4 },
  wordmarkText: { color: palette.charbon, fontSize: 44, lineHeight: 52 },
});
