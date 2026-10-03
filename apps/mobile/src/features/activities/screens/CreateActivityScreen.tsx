import { zodResolver } from '@hookform/resolvers/zod';
import { LIMITS, makeCreateActivityInputSchema } from '@lokky/shared';
import { router } from 'expo-router';
import { X } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import { Button, IconButton, ScreenHeader, Stepper, useToast } from '@/ui';
import { StepCost } from '../create/components/StepCost';
import { StepCount } from '../create/components/StepCount';
import { StepReview } from '../create/components/StepReview';
import { StepWhat } from '../create/components/StepWhat';
import { StepWhen } from '../create/components/StepWhen';
import { StepWhere } from '../create/components/StepWhere';
import {
  DEFAULT_CAPACITY,
  draftSchema,
  previewActivity,
  STEP_COUNT,
  STEP_FIELDS,
  toCreateInput,
  type Draft,
} from '../create/draft';
import { useCreateActivity } from '../create/useCreateActivity';

// Création en 5 étapes + récapitulatif (spec §6.2), en modale plein écran. Les marges de
// sécurité viennent du fournisseur racine : SafeAreaView les lit à zéro dans une modale iOS.
export function CreateActivityScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const toast = useToast();
  const me = useSessionStore((s) => s.me);
  const create = useCreateActivity();
  const [now] = useState(() => new Date());
  const [step, setStep] = useState(0);
  const { control, trigger, handleSubmit, formState } = useForm<Draft>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      title: '',
      description: '',
      day: '',
      time: '',
      placeId: null,
      placeName: '',
      neighborhood: me?.neighborhood,
      meetingPoint: '',
      capacity: DEFAULT_CAPACITY,
      costType: 'free',
      estimate: '',
    },
  });
  const values = useWatch({ control });
  const isLast = step === STEP_COUNT - 1;

  // Le bouton s'active dès que l'étape est remplie ; zod valide vraiment au clic.
  const filled = [
    !!values.category && (values.title ?? '').trim().length >= LIMITS.activity.titleMin,
    !!values.day && !!values.time,
    (values.placeName ?? '').trim().length >= 2 && (!!values.placeId || !!values.neighborhood),
    true,
    true,
    true,
  ][step];

  const close = () => {
    if (!formState.isDirty) return router.back();
    Alert.alert(t('create.discardTitle'), t('create.discardBody'), [
      { text: t('create.keep'), style: 'cancel' },
      { text: t('create.discard'), style: 'destructive', onPress: () => router.back() },
    ]);
  };
  const back = () => (step === 0 ? close() : setStep(step - 1));

  const publish = handleSubmit((draft) => {
    const input = toCreateInput(draft);
    // Le créneau a pu passer pendant la saisie : on revalide avec le schéma du contrat.
    if (!makeCreateActivityInputSchema().safeParse(input).success) {
      toast.show(t('create.errors.startsAt'), 'error');
      return setStep(1);
    }
    create.mutate(input, {
      onSuccess: (activity) => {
        toast.show(t('create.published'), 'success');
        router.replace({ pathname: '/activity/[id]', params: { id: activity.id } });
      },
      onError: () => toast.show(t('create.errors.generic'), 'error'),
    });
  });

  const next = async () => {
    if (isLast) return publish();
    if (await trigger(STEP_FIELDS[step])) setStep(step + 1);
  };

  const preview = (() => {
    if (!isLast || !me) return null;
    const parsed = draftSchema.safeParse(values);
    return parsed.success ? previewActivity(toCreateInput(parsed.data), me, now) : null;
  })();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader
        title={t('create.title')}
        onBack={back}
        right={
          <IconButton
            accessibilityLabel={t('common.close')}
            onPress={close}
            icon={<X size={24} color={colors.text} weight="bold" />}
          />
        }
      />
      <View style={styles.progress}>
        <Stepper step={step + 1} total={STEP_COUNT} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 0 ? <StepWhat control={control} errors={formState.errors} /> : null}
          {step === 1 ? <StepWhen control={control} now={now} /> : null}
          {step === 2 ? <StepWhere control={control} errors={formState.errors} /> : null}
          {step === 3 ? <StepCount control={control} /> : null}
          {step === 4 ? <StepCost control={control} errors={formState.errors} /> : null}
          {preview ? <StepReview activity={preview} now={now} onEdit={setStep} /> : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={isLast ? t('create.publish') : t('common.continue')}
            size="lg"
            fullWidth
            disabled={!filled}
            loading={create.isPending}
            onPress={next}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  progress: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.sm },
  content: { padding: t.spacing.screen, paddingBottom: t.spacing.xxxl },
  footer: { paddingHorizontal: t.spacing.screen, paddingVertical: t.spacing.md },
}));
