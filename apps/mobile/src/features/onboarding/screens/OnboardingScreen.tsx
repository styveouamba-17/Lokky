import { zodResolver } from '@hookform/resolvers/zod';
import { LIMITS } from '@lokky/shared';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles } from '@/theme';
import { Button, ScreenHeader, Stepper, useToast } from '@/ui';
import { StepInterests } from '../components/StepInterests';
import { StepPermissions } from '../components/StepPermissions';
import { StepSituation } from '../components/StepSituation';
import { StepYou } from '../components/StepYou';
import { onboardingSchema, STEP_COUNT, STEP_FIELDS } from '../form';
import { useCompleteOnboarding } from '../hooks/useCompleteOnboarding';

export function OnboardingScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const firstNameHint = useSessionStore((s) => s.firstNameHint);
  const signOut = useSessionStore((s) => s.signOut);
  const complete = useCompleteOnboarding();
  const [step, setStep] = useState(0);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { control, trigger, handleSubmit, formState } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { firstName: firstNameHint ?? '', birthDate: '', interests: [] },
  });
  const values = useWatch({ control });
  const isLast = step === STEP_COUNT - 1;

  // Le bouton s'active dès que l'étape est remplie ; zod valide vraiment au clic (âge…).
  const filled = [
    (values.firstName ?? '').trim().length >= LIMITS.user.firstNameMin && !!values.birthDate,
    !!values.status && !!values.neighborhood,
    (values.interests?.length ?? 0) >= LIMITS.user.interestsMin,
    true,
  ][step];

  const submit = handleSubmit((profile) =>
    complete.mutate(
      { profile, avatarUri },
      { onError: () => toast.show(t('onboarding.errors.save'), 'error') },
    ),
  );

  const next = async () => {
    if (isLast) return submit();
    if (await trigger(STEP_FIELDS[step])) setStep(step + 1);
  };
  // À la 1re étape, revenir en arrière ramène à la connexion (mauvais compte, par exemple).
  const back = () => (step === 0 ? void signOut() : setStep(step - 1));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader title="" onBack={back} />
      <View style={styles.progress}>
        <Stepper step={step + 1} total={STEP_COUNT} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 0 ? (
            <StepYou
              control={control}
              errors={formState.errors}
              avatarUri={avatarUri}
              onAvatarChange={setAvatarUri}
            />
          ) : null}
          {step === 1 ? <StepSituation control={control} /> : null}
          {step === 2 ? <StepInterests control={control} /> : null}
          {step === 3 ? <StepPermissions /> : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={isLast ? t('onboarding.finish') : t('common.continue')}
            size="lg"
            fullWidth
            disabled={!filled}
            loading={complete.isPending}
            onPress={next}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  progress: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.sm },
  content: { padding: t.spacing.screen, paddingBottom: t.spacing.xxxl },
  footer: { paddingHorizontal: t.spacing.screen, paddingVertical: t.spacing.md },
}));
