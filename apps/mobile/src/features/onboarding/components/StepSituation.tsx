import { NEIGHBORHOOD_IDS, NEIGHBORHOODS, USER_STATUSES, type UserStatus } from '@lokky/shared';
import { AirplaneLanding } from 'phosphor-react-native/src/icons/AirplaneLanding';
import { GraduationCap } from 'phosphor-react-native/src/icons/GraduationCap';
import { Sparkle } from 'phosphor-react-native/src/icons/Sparkle';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Chip, OptionCard, StepIntro, Text, type IconComponent } from '@/ui';
import type { OnboardingControl } from '../form';

const STATUS_ICONS: Record<UserStatus, IconComponent> = {
  student: GraduationCap,
  newcomer: AirplaneLanding,
  other: Sparkle,
};

export function StepSituation({ control }: { control: OnboardingControl }) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.stack}>
      <StepIntro title={t('onboarding.situation.title')} body={t('onboarding.situation.body')} />

      <View style={styles.group} accessibilityRole="radiogroup">
        <Text variant="label">{t('onboarding.situation.statusLabel')}</Text>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <>
              {USER_STATUSES.map((status) => (
                <OptionCard
                  key={status}
                  icon={STATUS_ICONS[status]}
                  title={t(`statuses.${status}`)}
                  body={t(`onboarding.situation.statusHints.${status}`)}
                  selected={field.value === status}
                  onPress={() => field.onChange(status)}
                />
              ))}
            </>
          )}
        />
      </View>

      <View style={styles.group}>
        <Text variant="label">{t('onboarding.situation.neighborhoodLabel')}</Text>
        <Controller
          control={control}
          name="neighborhood"
          render={({ field }) => (
            <View style={styles.chips}>
              {NEIGHBORHOOD_IDS.map((id) => (
                <Chip
                  key={id}
                  label={NEIGHBORHOODS[id].name}
                  selected={field.value === id}
                  onPress={() => field.onChange(id)}
                />
              ))}
            </View>
          )}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.xxl },
  group: { gap: t.spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
