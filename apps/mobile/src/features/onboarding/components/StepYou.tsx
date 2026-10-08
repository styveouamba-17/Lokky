import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Input, StepIntro } from '@/ui';
import type { OnboardingControl, OnboardingErrors } from '../form';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { BirthDateField } from './BirthDateField';

export function StepYou({
  control,
  errors,
}: {
  control: OnboardingControl;
  errors: OnboardingErrors;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  // Les messages zod de l'âge sont des clés i18n (errors.age_min…).
  const birthError = errors.birthDate?.message;

  return (
    <View style={styles.stack}>
      <StepIntro title={t('onboarding.you.title')} body={t('onboarding.you.body')} />
      <AvatarPlaceholder />
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
