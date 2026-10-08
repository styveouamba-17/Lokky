import { router } from 'expo-router';
import { Warning } from 'phosphor-react-native/src/icons/Warning';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { useWarningsStore } from '@/state/warnings';
import { makeStyles, useTheme } from '@/theme';
import { Button, Sheet, Text } from '@/ui';

// Avertissement de l'équipe (statut « warned ») : aucune restriction, mais la personne doit
// le voir. Affiché une fois par avertissement, à l'ouverture de l'app ou en direct
// (moderation:update) ; fermer la feuille vaut lecture.
export function WarningSheet() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const me = useSessionStore((s) => s.me);
  const seen = useWarningsStore((s) => (me ? s.seen[me.id] : undefined));
  const acknowledge = useWarningsStore((s) => s.acknowledge);

  const warnedAt = me?.moderation.status === 'warned' ? me.moderation.warnedAt : null;
  const visible = Boolean(me && warnedAt && seen !== warnedAt);
  const close = () => {
    if (me && warnedAt) acknowledge(me.id, warnedAt);
  };

  return (
    <Sheet visible={visible} onClose={close}>
      <View style={styles.content}>
        <View style={styles.disc} accessibilityElementsHidden importantForAccessibility="no">
          <Warning size={40} color={colors.warning} weight="duotone" />
        </View>
        <Text variant="heading" align="center" accessibilityRole="header">
          {t('moderation.warned.title')}
        </Text>
        <Text color="textMuted" align="center">
          {t('moderation.warned.body')}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label={t('moderation.warned.ok')} size="lg" fullWidth onPress={close} />
        <Button
          label={t('moderation.warned.rules')}
          variant="ghost"
          size="lg"
          fullWidth
          onPress={() => {
            close();
            router.push('/legal/terms');
          }}
        />
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((t) => ({
  content: { alignItems: 'center', gap: t.spacing.md },
  disc: {
    width: 80,
    height: 80,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surfaceMuted,
  },
  actions: { gap: t.spacing.sm },
}));
