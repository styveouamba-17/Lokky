import { router } from 'expo-router';
import { useRef, useState, type ComponentType } from 'react';
import {
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Button, Illustration, Text, type IllustrationName } from '@/ui';
import { PageDots } from '../components/PageDots';
import {
  AloneIllustration,
  TonightIllustration,
  TrustIllustration,
} from '../components/WelcomeIllustrations';

// artwork : illustration peinte qui remplace la composition une fois livrée. La slide du chat
// garde sa composition, faite avec le design system.
const SLIDES: {
  key: 'tonight' | 'alone' | 'trust';
  Fallback: ComponentType;
  artwork?: IllustrationName;
}[] = [
  { key: 'tonight', Fallback: TonightIllustration, artwork: 'welcome-tonight' },
  { key: 'alone', Fallback: AloneIllustration },
  { key: 'trust', Fallback: TrustIllustration, artwork: 'welcome-together' },
];

export function WelcomeScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const goToLogin = () => router.push('/login');
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  const next = () => {
    if (isLast) return goToLogin();
    scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        {isLast ? null : (
          <Button label={t('common.skip')} variant="ghost" size="sm" onPress={goToLogin} />
        )}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        testID="welcome-slides"
      >
        {SLIDES.map(({ key, Fallback, artwork }) => (
          <View key={key} style={[styles.slide, { width }]}>
            {artwork ? (
              <View style={styles.art}>
                <Illustration name={artwork} fallback={<Fallback />} style={styles.artImage} />
              </View>
            ) : (
              <Fallback />
            )}
            <View style={styles.copy}>
              <Text variant="title" align="center" accessibilityRole="header">
                {t(`welcome.slides.${key}.title`)}
              </Text>
              <Text color="textMuted" align="center">
                {t(`welcome.slides.${key}.body`)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PageDots count={SLIDES.length} index={index} />
        <Button
          label={isLast ? t('welcome.start') : t('common.next')}
          size="lg"
          fullWidth
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: t.spacing.sm,
  },
  slide: { flex: 1, paddingHorizontal: t.spacing.screen, gap: t.spacing.xxl },
  art: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  artImage: { borderRadius: t.radius.lg },
  copy: { gap: t.spacing.md, paddingBottom: t.spacing.lg },
  footer: {
    alignItems: 'center',
    gap: t.spacing.xl,
    paddingHorizontal: t.spacing.screen,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.lg,
  },
}));
