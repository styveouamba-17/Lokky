import { Gift } from 'phosphor-react-native/src/icons/Gift';
import { Wallet } from 'phosphor-react-native/src/icons/Wallet';
import { Controller, useController, type Control, type FieldErrors } from 'react-hook-form';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Input, OptionCard, StepIntro } from '@/ui';
import type { Draft } from '../draft';

// Coût (spec §2) : gratuit par défaut, sinon « chacun paie sa part ». Aucun paiement dans l'app.
export function StepCost({
  control,
  errors,
}: {
  control: Control<Draft>;
  errors: FieldErrors<Draft>;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const costType = useController({ control, name: 'costType' });
  const split = costType.field.value === 'split';

  return (
    <View style={styles.stack}>
      <StepIntro title={t('create.cost.title')} body={t('create.cost.body')} />
      <View style={styles.group} accessibilityRole="radiogroup">
        <OptionCard
          icon={Gift}
          title={t('create.cost.free')}
          body={t('create.cost.freeBody')}
          selected={!split}
          onPress={() => costType.field.onChange('free')}
        />
        <OptionCard
          icon={Wallet}
          title={t('create.cost.split')}
          body={t('create.cost.splitBody')}
          selected={split}
          onPress={() => costType.field.onChange('split')}
        />
      </View>
      {split ? (
        <Controller
          control={control}
          name="estimate"
          render={({ field }) => (
            <Input
              label={t('create.cost.estimate')}
              placeholder={t('create.cost.estimatePlaceholder')}
              value={field.value}
              onChangeText={(text) => field.onChange(text.replace(/\D/g, ''))}
              onBlur={field.onBlur}
              keyboardType="number-pad"
              error={errors.estimate ? t('create.cost.estimateError') : null}
              hint="FCFA"
              maxLength={6}
            />
          )}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.xl },
  group: { gap: t.spacing.md },
}));
