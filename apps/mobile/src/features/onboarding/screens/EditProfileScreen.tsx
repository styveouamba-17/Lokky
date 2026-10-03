import { zodResolver } from '@hookform/resolvers/zod';
import { LIMITS } from '@lokky/shared';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles } from '@/theme';
import { Button, Input, ScreenHeader, useToast } from '@/ui';
import { setAvatarUrl, updateProfile, uploadAvatar } from '../api';
import { AvatarPicker } from '../components/AvatarPicker';
import { StepInterests } from '../components/StepInterests';
import { StepSituation } from '../components/StepSituation';
import { onboardingSchema, type OnboardingFormValues } from '../form';

// Modifier son profil (Réglages) : mêmes champs que l'onboarding, sauf la date de naissance,
// qui ne change pas. Vit ici pour réutiliser les composants du formulaire.
export function EditProfileScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const me = useSessionStore((s) => s.me);
  const setMe = useSessionStore((s) => s.setMe);
  const [avatarUri, setAvatarUri] = useState<string | null>(me?.avatarUrl ?? null);
  const { control, handleSubmit, formState } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: me?.firstName ?? '',
      birthDate: me?.birthDate ?? '',
      status: me?.status,
      neighborhood: me?.neighborhood,
      interests: me?.interests ?? [],
    },
  });
  const interests = useWatch({ control, name: 'interests' }) ?? [];

  const save = useMutation({
    mutationFn: async (values: {
      firstName: string;
      status: NonNullable<typeof me>['status'];
      neighborhood: NonNullable<typeof me>['neighborhood'];
      interests: NonNullable<typeof me>['interests'];
    }) => {
      let updated = await updateProfile(values);
      // Nouvelle photo choisie (URI locale) : envoi, puis mise à jour du profil.
      if (avatarUri && avatarUri !== me?.avatarUrl) {
        updated = await setAvatarUrl(await uploadAvatar(avatarUri));
      }
      return updated;
    },
    onSuccess: async (updated) => {
      await setMe(updated);
      toast.show(t('settings.saved'), 'success');
      router.back();
    },
    onError: () => toast.show(t('settings.error'), 'error'),
  });

  const submit = handleSubmit(({ firstName, status, neighborhood, interests: list }) =>
    save.mutate({ firstName, status, neighborhood, interests: list }),
  );

  if (!me) return null;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.editProfile.title')} onBack={() => router.back()} />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AvatarPicker uri={avatarUri} onChange={setAvatarUri} />
          <Controller
            control={control}
            name="firstName"
            render={({ field }) => (
              <Input
                label={t('settings.editProfile.firstName')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={formState.errors.firstName ? t('settings.editProfile.firstNameError') : null}
                autoCapitalize="words"
                maxLength={LIMITS.user.firstNameMax}
              />
            )}
          />
          <StepSituation control={control} />
          <StepInterests control={control} />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={t('settings.editProfile.save')}
            size="lg"
            fullWidth
            disabled={interests.length < LIMITS.user.interestsMin}
            loading={save.isPending}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  content: { padding: t.spacing.screen, gap: t.spacing.xxl, paddingBottom: t.spacing.xxxl },
  footer: { paddingHorizontal: t.spacing.screen, paddingVertical: t.spacing.md },
}));
