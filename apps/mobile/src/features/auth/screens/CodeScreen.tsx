import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isApiError } from '@/api/errors';
import { MOCK_EMAIL_CODE } from '@/api/mock/accountHandlers';
import { useTranslation } from '@/i18n';
import { env } from '@/lib/env';
import { makeStyles } from '@/theme';
import { Button, CodeInput, ScreenHeader, Text, useToast } from '@/ui';
import { authErrorMessage } from '../errors';
import { useCountdown } from '../hooks/useCountdown';
import { useEmailCode } from '../hooks/useEmailCode';
import { useVerifyCode } from '../hooks/useVerifyCode';

const CODE_LENGTH = 6;
const RESEND_DELAY_S = 30;

export function CodeScreen({ email }: { email: string }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const verify = useVerifyCode(email);
  const resend = useEmailCode();
  const countdown = useCountdown(RESEND_DELAY_S);

  const submit = (value: string) =>
    verify.mutate(value, {
      onError: (e) => {
        setCode('');
        setError(
          isApiError(e) && e.code === 'validation'
            ? t('code.errors.invalid')
            : authErrorMessage(e, t),
        );
      },
    });

  const onChange = (value: string) => {
    setCode(value);
    setError(null);
    if (value.length === CODE_LENGTH && !verify.isPending) submit(value); // envoi automatique
  };

  const onResend = () =>
    resend.mutate(email, {
      onSuccess: () => {
        countdown.restart();
        toast.show(t('code.resent'), 'success');
      },
      onError: (e) => toast.show(authErrorMessage(e, t), 'error'),
    });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader title="" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text variant="title" align="center" accessibilityRole="header">
              {t('code.title')}
            </Text>
            <Text color="textMuted" align="center">
              {t('code.body', { email })}
            </Text>
          </View>

          <CodeInput
            value={code}
            onChange={onChange}
            length={CODE_LENGTH}
            label={t('code.label')}
            error={error}
            disabled={verify.isPending}
            autoFocus
          />

          {env.apiMode === 'mock' ? (
            <Text variant="caption" color="secondary" align="center">
              {t('code.demoHint', { code: MOCK_EMAIL_CODE })}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              label={
                countdown.seconds > 0
                  ? t('code.resendIn', { seconds: countdown.seconds })
                  : t('code.resend')
              }
              variant="ghost"
              disabled={countdown.seconds > 0}
              loading={resend.isPending}
              onPress={onResend}
            />
            <Button label={t('code.changeEmail')} variant="ghost" onPress={() => router.back()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, gap: t.spacing.xxl, padding: t.spacing.screen },
  header: { gap: t.spacing.md, marginTop: t.spacing.xl },
  actions: { alignItems: 'center', gap: t.spacing.xs },
}));
