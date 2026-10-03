import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';
import { useTranslation } from '@/i18n';
import { makeStyles, motion } from '@/theme';

export function PageDots({ count, index }: { count: number; index: number }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t('welcome.slideLabel', { current: index + 1, total: count })}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} active={i === index} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const animated = useAnimatedStyle(() => {
    const width = active ? 24 : 8;
    return { width: reduceMotion ? width : withTiming(width, { duration: motion.base }) };
  }, [active, reduceMotion]);
  return <Animated.View style={[styles.dot, active ? styles.active : styles.idle, animated]} />;
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.spacing.sm, alignItems: 'center' },
  dot: { height: 8, borderRadius: t.radius.full },
  active: { backgroundColor: t.colors.brand },
  idle: { backgroundColor: t.colors.border },
}));
