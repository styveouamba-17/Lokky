import { NEIGHBORHOODS } from '@lokky/shared';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles } from '@/theme';
import { Avatar, Badge, Button, Card, CATEGORY_ICONS, Text } from '@/ui';

// Profil (spec §6.2) : photo, prénom, quartier, envies, statistiques de confiance.
// Pas de compteur d'abonnés. Modification et réglages arrivent aux jalons 6 et 7.
export function MyProfileScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const me = useSessionStore((s) => s.me);
  const signOut = useSessionStore((s) => s.signOut);
  if (!me) return null;

  const { trust } = me;
  const stats = [
    { label: t('profile.attended'), value: String(trust.activitiesAttended) },
    {
      label: t('profile.attendance'),
      value:
        trust.attendanceRate === null
          ? t('profile.newMember')
          : `${Math.round(trust.attendanceRate * 100)} %`,
    },
    { label: t('profile.created'), value: String(trust.activitiesCreated) },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <Avatar name={me.firstName} uri={me.avatarUrl} size="xl" />
          <Text variant="title" accessibilityRole="header">
            {me.firstName}
          </Text>
          <Text color="textMuted">
            {t(`statuses.${me.status}`)} · {NEIGHBORHOODS[me.neighborhood].name}
          </Text>
        </View>

        <Card style={styles.stats}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={styles.stat}
              accessible
              accessibilityLabel={`${s.label} : ${s.value}`}
            >
              <Text variant="heading">{s.value}</Text>
              <Text variant="caption" color="textMuted">
                {s.label}
              </Text>
            </View>
          ))}
        </Card>

        <View style={styles.section}>
          <Text variant="heading" accessibilityRole="header">
            {t('profile.interests')}
          </Text>
          <View style={styles.badges}>
            {me.interests.map((c) => (
              <Badge key={c} label={t(`categories.${c}`)} icon={CATEGORY_ICONS[c]} tone="neutral" />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          {__DEV__ ? (
            <Button
              label={t('profile.designSystem')}
              variant="ghost"
              onPress={() => router.push('/dev/ui')}
            />
          ) : null}
          <Button
            label={t('profile.signOut')}
            variant="secondary"
            fullWidth
            onPress={() => void signOut()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.screen, gap: t.spacing.xxl },
  identity: { alignItems: 'center', gap: t.spacing.sm, paddingTop: t.spacing.lg },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2, flex: 1 },
  section: { gap: t.spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  actions: { gap: t.spacing.sm, alignItems: 'center' },
}));
