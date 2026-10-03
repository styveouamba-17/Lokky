import type { ActivityLocation } from '@lokky/shared';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { Linking, Platform, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Button, Text } from '@/ui';

// Lien vers l'app de cartes du téléphone, centré sur le lieu.
export function mapsUrl({ name, coordinates: { lat, lng } }: ActivityLocation) {
  const label = encodeURIComponent(name);
  return Platform.OS === 'ios'
    ? `maps:0,0?q=${label}&ll=${lat},${lng}`
    : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
}

// Mini-carte (spec §6.2) : visuel stylisé en attendant le choix d'un fournisseur de cartes
// statiques. Le bouton ouvre la vraie carte du téléphone.
export function MeetupCard({ location }: { location: ActivityLocation }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.map} accessibilityElementsHidden importantForAccessibility="no">
        <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
          <Path
            d="M0 28 C 25 20, 45 34, 70 24 S 95 18, 100 20"
            stroke={colors.border}
            strokeWidth={3}
            fill="none"
          />
          <Path
            d="M30 0 L 38 40 M 72 0 L 64 40"
            stroke={colors.border}
            strokeWidth={2}
            fill="none"
          />
        </Svg>
        <View style={styles.pin}>
          <MapPin size={32} color={colors.brand} weight="fill" />
        </View>
      </View>
      <View style={styles.body}>
        <Text variant="bodyStrong">{location.name}</Text>
        {location.meetingPoint ? (
          <Text variant="caption" color="textMuted">
            {t('activity.meetingPoint', { place: location.meetingPoint })}
          </Text>
        ) : null}
        <Button
          label={t('activity.openMaps')}
          variant="secondary"
          size="sm"
          onPress={() => void Linking.openURL(mapsUrl(location))}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: 'hidden',
    backgroundColor: t.colors.surface,
  },
  map: { height: 96, backgroundColor: t.colors.surfaceMuted, justifyContent: 'center' },
  pin: { position: 'absolute', alignSelf: 'center' },
  body: { padding: t.spacing.lg, gap: t.spacing.sm, alignItems: 'flex-start' },
}));
