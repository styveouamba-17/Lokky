import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Input, StepIntro } from '@/ui';
import type { OnboardingControl, OnboardingErrors } from '../form';
import { AvatarPicker } from './AvatarPicker';
import { BirthDateField } from './BirthDateField';

export function StepYou({
  control,
  errors,
  avatarUri,
  onAvatarChange,
}: {
  control: OnboardingControl;
  errors: OnboardingErrors;
  avatarUri: string | null;
  onAvatarChange: (uri: string) => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  // Les messages zod de l'âge sont des clés i18n (errors.age_min…).
  const birthError = errors.birthDate?.message;

  return (
    <View style={styles.stack}>
      <StepIntro title={t('onboarding.you.title')} body={t('onboarding.you.body')} />
      <AvatarPicker uri={avatarUri} onChange={onAvatarChange} />
      <Controller
        control={control}
        name="firstName"
        render={({ field }) => (
          <Input
            label={t('onboarding.you.firstName')}
            placeholder={t('onboarding.you.firstNamePlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.firstName ? t('onboarding.you.firstNameError') : null}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            maxLength={30}
          />
        )}
      />
      <Controller
        control={control}
        name="birthDate"
        render={({ field }) => (
          <BirthDateField
            value={field.value}
            onChange={field.onChange}
            error={
              birthError
                ? birthError.startsWith('errors.')
                  ? t(birthError as 'errors.age_min')
                  : t('errors.age_max')
                : null
            }
          />
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({ stack: { gap: t.spacing.xl } }));
