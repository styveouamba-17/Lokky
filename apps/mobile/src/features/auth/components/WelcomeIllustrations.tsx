import { SealCheck } from 'phosphor-react-native/src/icons/SealCheck';
import { SunHorizon } from 'phosphor-react-native/src/icons/SunHorizon';
import { Tag } from 'phosphor-react-native/src/icons/Tag';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Avatar, AvatarStack, Badge, Card, CATEGORY_ICONS, LokkyLogo, Text } from '@/ui';

// Illustrations des slides Bienvenue, composées avec le design system (spec §12, point 4 :
// en attendant les illustrations peintes définitives). Décoratives : masquées aux lecteurs
// d'écran, le titre et le texte de la slide portent le message.

const PEOPLE = [
  { id: 'p1', name: 'Awa', uri: null },
  { id: 'p2', name: 'Moussa', uri: null },
  { id: 'p3', name: 'Fatou', uri: null },
  { id: 'p4', name: 'Ibrahima', uri: null },
];

export function TonightIllustration() {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View
      style={styles.stage}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={styles.halo} />
      <View style={styles.tilted}>
        <LokkyLogo variant="symbol" size={168} />
      </View>
      <View style={[styles.floating, { top: '14%', left: '6%' }]}>
        <Badge label={t('welcome.demo.chips.tonight')} tone="accent" icon={SunHorizon} />
      </View>
      <View style={[styles.floating, { top: '22%', right: '4%' }]}>
        <Badge label={t('welcome.demo.chips.sport')} tone="neutral" icon={CATEGORY_ICONS.sport} />
      </View>
      <View style={[styles.floating, { bottom: '16%', left: '2%' }]}>
        <Badge label={t('welcome.demo.chips.cine')} tone="neutral" icon={CATEGORY_ICONS.cinema} />
      </View>
      <View style={[styles.floating, { bottom: '10%', right: '8%' }]}>
        <Badge label={t('welcome.demo.chips.tea')} tone="neutral" icon={CATEGORY_ICONS.food} />
      </View>
    </View>
  );
}

export function AloneIllustration() {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View
      style={styles.stage}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Card style={styles.chat}>
        <View style={styles.chatHeader}>
          <AvatarStack people={PEOPLE} total={6} size="sm" />
          <Text variant="caption" color="textMuted">
            {t('welcome.demo.title')}
          </Text>
        </View>
        <Bubble name="Khady" text={t('welcome.demo.q1')} />
        <Bubble mine text={t('welcome.demo.a1')} />
        <Bubble name="Cheikh" text={t('welcome.demo.a2')} />
      </Card>
    </View>
  );
}

function Bubble({ text, name, mine = false }: { text: string; name?: string; mine?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      {name ? <Avatar name={name} uri={null} size="sm" /> : null}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text variant="caption" color={mine ? 'onAction' : 'text'}>
          {text}
        </Text>
      </View>
    </View>
  );
}

export function TrustIllustration() {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View
      style={styles.stage}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Card style={styles.activity}>
        <View style={styles.cover}>
          <LokkyLogo variant="symbol" size={64} />
        </View>
        <View style={styles.activityBody}>
          <View style={styles.row}>
            <Badge label={t('welcome.demo.free')} tone="free" icon={Tag} />
            <Badge label={t('welcome.demo.trusted')} tone="trust" icon={SealCheck} />
          </View>
          <Text variant="heading">{t('welcome.demo.title')}</Text>
          <Text variant="caption" color="textMuted">
            {t('welcome.demo.when')} · {t('welcome.demo.where')}
          </Text>
          <View style={styles.row}>
            <AvatarStack people={PEOPLE} total={6} size="sm" />
            <Text variant="caption">{t('welcome.demo.spots')}</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stage: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.accent,
    opacity: t.scheme === 'dark' ? 0.18 : 0.35,
  },
  tilted: { transform: [{ rotate: '-6deg' }] },
  floating: { position: 'absolute', transform: [{ rotate: '-3deg' }] },
  chat: { width: '100%', maxWidth: 340, gap: t.spacing.md },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    marginBottom: t.spacing.xs,
  },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: t.spacing.sm },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.lg,
  },
  bubbleOther: { backgroundColor: t.colors.surfaceMuted, borderBottomLeftRadius: t.radius.sm / 2 },
  bubbleMine: { backgroundColor: t.colors.action, borderBottomRightRadius: t.radius.sm / 2 },
  activity: { width: '100%', maxWidth: 340, padding: 0, overflow: 'hidden' },
  cover: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.brand,
  },
  activityBody: { padding: t.spacing.lg, gap: t.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flexWrap: 'wrap' },
}));
