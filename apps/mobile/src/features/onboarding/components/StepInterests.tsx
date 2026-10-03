import { ACTIVITY_CATEGORIES, LIMITS, type ActivityCategory } from '@lokky/shared';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { CATEGORY_ICONS, Chip, StepIntro, Text } from '@/ui';
import type { OnboardingControl } from '../form';

const toggle = (list: ActivityCategory[], item: ActivityCategory) =>
  list.includes(item) ? list.filter((c) => c !== item) : [...list, item];

export function StepInterests({ control }: { control: OnboardingControl }) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.stack}>
      <StepIntro title={t('onboarding.interests.title')} body={t('onboarding.interests.body')} />
      <Controller
        control={control}
        name="interests"
        render={({ field }) => {
          const selected = field.value ?? [];
          return (
            <>
              <View style={styles.chips}>
                {ACTIVITY_CATEGORIES.map((category) => (
                  <Chip
                    key={category}
                    label={t(`categories.${category}`)}
                    icon={CATEGORY_ICONS[category]}
                    selected={selected.includes(category)}
                    onPress={() => field.onChange(toggle(selected, category))}
                  />
                ))}
              </View>
              <Text
                variant="caption"
                color={selected.length >= LIMITS.user.interestsMin ? 'success' : 'textMuted'}
                accessibilityLiveRegion="polite"
              >
                {t('onboarding.interests.counter', { count: selected.length })}
              </Text>
            </>
          );
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
