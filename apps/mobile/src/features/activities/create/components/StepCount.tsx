import { LIMITS } from '@lokky/shared';
import { Minus } from 'phosphor-react-native/src/icons/Minus';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { useController, type Control } from 'react-hook-form';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Chip, IconButton, StepIntro, Text } from '@/ui';
import type { Draft } from '../draft';

const { capacityMin: MIN, capacityMax: MAX } = LIMITS.activity;
const QUICK = [4, 6, 10, 20];

// « Combien ? » : de 2 à 20 personnes, créateur compris.
export function StepCount({ control }: { control: Control<Draft> }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { field } = useController({ control, name: 'capacity' });
  const value = field.value;
  const set = (next: number) => field.onChange(Math.min(MAX, Math.max(MIN, next)));

  return (
    <View style={styles.stack}>
      <StepIntro title={t('create.count.title')} body={t('create.count.body')} />
      <View
        style={styles.counter}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('create.count.title')}
        accessibilityValue={{
          min: MIN,
          max: MAX,
          now: value,
          text: t('create.count.people', { count: value }),
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          set(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))
        }
      >
        <IconButton
          variant="filled"
          accessibilityLabel={t('create.count.less')}
          disabled={value <= MIN}
          onPress={() => set(value - 1)}
          icon={<Minus size={24} color={colors.text} weight="bold" />}
        />
        <View style={styles.valueBox}>
          <Text variant="display" align="center">
            {value}
          </Text>
          <Text variant="caption" color="textMuted" align="center">
            {t('create.count.people', { count: value })}
          </Text>
        </View>
        <IconButton
          variant="filled"
          accessibilityLabel={t('create.count.more')}
          disabled={value >= MAX}
          onPress={() => set(value + 1)}
          icon={<Plus size={24} color={colors.text} weight="bold" />}
        />
      </View>
      <View style={styles.quick}>
        {QUICK.map((n) => (
          <Chip key={n} label={String(n)} selected={value === n} onPress={() => set(n)} />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.xxl },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.xxl,
  },
  valueBox: { minWidth: 96 },
  quick: { flexDirection: 'row', justifyContent: 'center', gap: t.spacing.sm },
}));
