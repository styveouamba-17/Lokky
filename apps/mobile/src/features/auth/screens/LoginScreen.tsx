import { zodResolver } from '@hookform/resolvers/zod';
import { emailStartInputSchema } from '@lokky/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Button, Input, LokkyLogo, Text, useToast } from '@/ui';
import { SocialButtons } from '../components/SocialButtons';
import { authErrorMessage } from '../errors';
import { useEmailCode } from '../hooks/useEmailCode';
import { useSocialSignIn } from '../hooks/useSocialSignIn';
import type { OAuthProvider } from '../providers';

const PROVIDER_NAMES: Record<OAuthProvider, string> = { apple: 'Apple', google: 'Google' };

export function LoginScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const social = useSocialSignIn();
  const emailCode = useEmailCode();
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(emailStartInputSchema),
    defaultValues: { email: '' },
  });

  const onSocial = (provider: OAuthProvider) => {
    setPending(provider);
    social.mutate(provider, {
      // La garde de navigation (app/_layout.tsx) emmène vers l'onboarding ou l'app.
      // Résultat null : annulé par l'utilisateur, rien à signaler.
      onSuccess: (result) => {
        if (result) toast.show(t('login.signedIn'), 'success');
      },
      onError: (error) => toast.show(authErrorMessage(error, t, PROVIDER_NAMES[provider]), 'error'),
      onSettled: () => setPending(null),
    });
  };

  const onEmail = handleSubmit(({ email }) =>
    emailCode.mutate(email, {
      onSuccess: () => router.push({ pathname: '/code', params: { email } }),
      onError: (error) => toast.show(authErrorMessage(error, t), 'error'),
    }),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <LokkyLogo variant="symbol" size={64} />
            <Text variant="title" align="center" accessibilityRole="header">
              {t('login.title')}
            </Text>
            <Text color="textMuted" align="center">
              {t('login.subtitle')}
            </Text>
          </View>

          <SocialButtons onPress={onSocial} pending={pending} />

          <View style={styles.separator}>
            <View style={styles.line} />
            <Text variant="caption" color="textMuted">
              {t('common.or')}
            </Text>
            <View style={styles.line} />
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  label={t('login.emailLabel')}
                  placeholder={t('login.emailPlaceholder')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={formState.errors.email ? t('login.errors.email') : null}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={onEmail}
                />
              )}
            />
            <Button
              label={t('login.emailSubmit')}
              size="lg"
              fullWidth
              loading={emailCode.isPending}
              disabled={pending !== null}
              onPress={onEmail}
            />
          </View>

          <Text variant="caption" color="textMuted" align="center">
            {t('login.legal.before')}
            <Text
              variant="caption"
              color="action"
              accessibilityRole="link"
              onPress={() => router.push('/legal/terms')}
            >
              {t('login.legal.terms')}
            </Text>
            {t('login.legal.middle')}
            <Text
              variant="caption"
              color="action"
              accessibilityRole="link"
              onPress={() => router.push('/legal/privacy')}
            >
              {t('login.legal.privacy')}
            </Text>
            {t('login.legal.after')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: t.spacing.xxl,
    padding: t.spacing.screen,
  },
  header: { alignItems: 'center', gap: t.spacing.md },
  separator: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  line: { flex: 1, height: 1, backgroundColor: t.colors.border },
  form: { gap: t.spacing.lg },
}));
