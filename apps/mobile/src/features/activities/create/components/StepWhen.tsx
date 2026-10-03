import { useMemo } from 'react';
import { useController, type Control } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { formatDayChip } from '@/lib';
import { makeStyles } from '@/theme';
import { Chip, StepIntro, Text } from '@/ui';
import { dayOptions, isoDay, nextSaturday, timeSlots, type Draft } from '../draft';

const EVENING = '19:00';
// « 19:00 » → « 19h », « 19:30 » → « 19h30 », comme dans le reste de l'app.
const slotLabel = (slot: string) =>
  `${Number(slot.slice(0, 2))}h${slot.endsWith(':00') ? '' : '30'}`;

// « Quand ? » (spec §2, principe 2) : raccourcis concrets, puis jour et créneau.
export function StepWhen({ control, now }: { control: Control<Draft>; now: Date }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const day = useController({ control, name: 'day' });
  const time = useController({ control, name: 'time' });
  const days = useMemo(() => dayOptions(now), [now]);
  const slots = day.field.value ? timeSlots(day.field.value, now) : [];

  // Change de jour en gardant l'heure si elle reste possible, sinon la soirée par défaut.
  const pickDay = (date: Date, preferred = time.field.value) => {
    const iso = isoDay(date);
    const available = timeSlots(iso, now);
    day.field.onChange(iso);
    time.field.onChange(
      available.includes(preferred)
        ? preferred
        : (available.find((s) => s >= EVENING) ?? available[0] ?? ''),
    );
  };

  const today = days[0]!;
  const shortcuts = [
    { key: 'tonight', label: t('create.when.tonight'), date: today, time: EVENING },
    { key: 'tomorrow', label: t('create.when.tomorrow'), date: days[1]!, time: EVENING },
    { key: 'saturday', label: t('create.when.saturday'), date: nextSaturday(now), time: '17:00' },
  ];

  return (
    <View style={styles.stack}>
      <StepIntro title={t('create.when.title')} body={t('create.when.body')} />

      <View style={styles.row}>
        {shortcuts.map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            selected={
              day.field.value === isoDay(s.date) &&
              (s.key !== 'tonight' || time.field.value >= EVENING)
            }
            onPress={() => pickDay(s.date, s.time)}
          />
        ))}
      </View>

      <View style={styles.group}>
        <Text variant="label">{t('create.when.day')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {days.map((d) => (
            <Chip
              key={d.toISOString()}
              label={formatDayChip(d)}
              selected={day.field.value === isoDay(d)}
              onPress={() => pickDay(d)}
            />
          ))}
        </ScrollView>
      </View>

      {day.field.value ? (
        <View style={styles.group}>
          <Text variant="label">{t('create.when.time')}</Text>
          {slots.length === 0 ? (
            <Text color="textMuted">{t('create.when.noSlots')}</Text>
          ) : (
            <View style={styles.wrap}>
              {slots.map((slot) => (
                <Chip
                  key={slot}
                  label={slotLabel(slot)}
                  selected={time.field.value === slot}
                  onPress={() => time.field.onChange(slot)}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.xl },
  group: { gap: t.spacing.md },
  row: { flexDirection: 'row', gap: t.spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
