import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Warning } from 'phosphor-react-native/src/icons/Warning';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import { Button, Card, Input, ScreenHeader, Text, useToast } from '@/ui';
import { deleteAccount } from '../api';

// Suppression de compte (exigée par les stores) : définitive, confirmée en tapant un mot.
export function DeleteAccountScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const signOut = useSessionStore((s) => s.signOut);
  const [confirm, setConfirm] = useState('');
  const word = t('settings.delete.confirmWord');
  const confirmed = confirm.trim().toUpperCase() === word;

  const remove = useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: async () => {
      // L'écran d'au revoir n'est pas protégé par la garde : il reste affiché après la
      // déconnexion. Le compte n'existe plus, rien à révoquer côté serveur.
      router.replace('/goodbye');
      await signOut({ revoke: false });
    },
    onError: () => toast.show(t('settings.delete.error'), 'error'),
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.delete.title')} onBack={() => router.back()} />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.warning}>
            <Warning size={24} color={colors.danger} weight="fill" />
            <Text style={styles.flex}>{t('settings.delete.body')}</Text>
          </Card>
          <Input
            label={t('settings.delete.confirmLabel')}
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={word}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={t('settings.delete.submit')}
            variant="danger"
            size="lg"
            fullWidth
            disabled={!confirmed}
            loading={remove.isPending}
            onPress={() => remove.mutate()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  content: { padding: t.spacing.screen, gap: t.spacing.xl },
  warning: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' },
  footer: { paddingHorizontal: t.spacing.screen, paddingVertical: t.spacing.md },
}));
