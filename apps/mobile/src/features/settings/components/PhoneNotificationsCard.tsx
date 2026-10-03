import * as Notifications from 'expo-notifications';
import { BellSlash } from 'phosphor-react-native/src/icons/BellSlash';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Button, Card, Text } from '@/ui';

type PhoneState = 'granted' | 'denied' | 'undetermined' | 'unknown';

// Les préférences du compte ne suffisent pas : le téléphone doit aussi autoriser Lokky.
// Si ce n'est pas le cas, on le dit, avec le bon bouton (demander, ou ouvrir les réglages).
export function PhoneNotificationsCard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [state, setState] = useState<PhoneState>('unknown');

  const refresh = useCallback(() => {
    Notifications.getPermissionsAsync()
      .then((p) => setState((p?.status as PhoneState | undefined) ?? 'unknown'))
      .catch(() => setState('unknown'));
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  if (state === 'granted' || state === 'unknown') return null;

  const enable = async () => {
    if (state === 'undetermined') {
      const result = await Notifications.requestPermissionsAsync();
      setState(result.status as PhoneState);
    } else {
      // Refus déjà donné : seul le téléphone peut le lever.
      await Linking.openSettings();
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <BellSlash size={24} color={colors.warning} weight="bold" />
        <View style={styles.text}>
          <Text variant="bodyStrong">{t('settings.notif.phoneOffTitle')}</Text>
          <Text variant="caption" color="textMuted">
            {t('settings.notif.phoneOffBody')}
          </Text>
        </View>
      </View>
      <Button
        label={
          state === 'undetermined' ? t('settings.notif.allow') : t('settings.notif.openSettings')
        }
        size="sm"
        onPress={() => void enable()}
      />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: t.spacing.md, alignItems: 'flex-start' },
  row: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' },
  text: { flex: 1, gap: 2 },
}));
