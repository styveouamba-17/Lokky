import { ACTIVITY_CATEGORIES } from '@lokky/shared';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { CATEGORY_ICONS, Chip, Input, StepIntro, Text, TextArea } from '@/ui';
import type { Draft } from '../draft';

export function StepWhat({
  control,
  errors,
}: {
  control: Control<Draft>;
  errors: FieldErrors<Draft>;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.stack}>
      <StepIntro title={t('create.what.title')} body={t('create.what.body')} />
      <View style={styles.group}>
        <Text variant="label">{t('create.what.category')}</Text>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <View style={styles.chips}>
              {ACTIVITY_CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  label={t(`categories.${category}`)}
                  icon={CATEGORY_ICONS[category]}
                  selected={field.value === category}
                  onPress={() => field.onChange(category)}
                />
              ))}
            </View>
          )}
        />
      </View>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <Input
            label={t('create.what.titleLabel')}
            placeholder={t('create.what.titlePlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.title ? t('create.what.titleError') : null}
            maxLength={60}
            showCounter
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextArea
            label={t('create.what.description')}
            placeholder={t('create.what.descriptionPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={500}
          />
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.xl },
  group: { gap: t.spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
