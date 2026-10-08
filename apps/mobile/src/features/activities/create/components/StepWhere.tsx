import { NEIGHBORHOOD_IDS, NEIGHBORHOODS, POPULAR_PLACES } from '@lokky/shared';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { Controller, useController, type Control, type FieldErrors } from 'react-hook-form';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Chip, Input, StepIntro, Text } from '@/ui';
import type { Draft } from '../draft';

// « Où ? » : un lieu populaire donne des coordonnées précises ; un lieu saisi librement
// prend celles du quartier choisi.
export function StepWhere({
  control,
  errors,
  meetingPointOnly = false,
}: {
  control: Control<Draft>;
  errors: FieldErrors<Draft>;
  meetingPointOnly?: boolean;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const placeId = useController({ control, name: 'placeId' });
  const placeName = useController({ control, name: 'placeName' });
  const neighborhood = useController({ control, name: 'neighborhood' });

  return (
    <View style={styles.stack}>
      <StepIntro title={t('create.where.title')} body={t('create.where.body')} />

      {meetingPointOnly ? null : (
        <View style={styles.group}>
          <Text variant="label">{t('create.where.popular')}</Text>
          <View style={styles.chips}>
            {POPULAR_PLACES.map((place) => (
              <Chip
                key={place.id}
                label={place.name}
                icon={MapPin}
                selected={placeId.field.value === place.id}
                onPress={() => {
                  placeId.field.onChange(place.id);
                  placeName.field.onChange(place.name);
                  neighborhood.field.onChange(place.neighborhood);
                }}
              />
            ))}
          </View>
        </View>
      )}

      {meetingPointOnly ? null : (
        <>
          <Input
            label={t('create.where.place')}
            placeholder={t('create.where.placePlaceholder')}
            value={placeName.field.value}
            onChangeText={(text) => {
              placeName.field.onChange(text);
              placeId.field.onChange(null);
            }}
            onBlur={placeName.field.onBlur}
            error={errors.placeName ? t('create.where.placeError') : null}
            maxLength={80}
          />
          {placeId.field.value ? null : (
            <View style={styles.group}>
              <Text variant="label">{t('create.where.neighborhood')}</Text>
              <View style={styles.chips}>
                {NEIGHBORHOOD_IDS.map((id) => (
                  <Chip
                    key={id}
                    label={NEIGHBORHOODS[id].name}
                    selected={neighborhood.field.value === id}
                    onPress={() => neighborhood.field.onChange(id)}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}

      <Controller
        control={control}
        name="meetingPoint"
        render={({ field }) => (
          <Input
            label={t('create.where.meetingPoint')}
            placeholder={t('create.where.meetingPointPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={120}
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
