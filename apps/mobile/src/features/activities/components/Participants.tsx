import type { Activity, UserPreview } from '@lokky/shared';
import { ScrollView, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Avatar, Text } from '@/ui';

// « Qui vient ? » : visages et prénoms, plus la mention pour ceux qui viennent seuls.
export function Participants({
  activity,
  participants,
  viewerId,
}: {
  activity: Activity;
  participants: UserPreview[] | undefined; // liste complète, une fois chargée
  viewerId: string | undefined;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  // En attendant la liste complète, l'aperçu fourni avec l'activité s'affiche tout de suite.
  const people = participants ?? activity.participantsPreview;

  return (
    <View style={styles.section}>
      <Text variant="heading" accessibilityRole="header">
        {t('activity.whoComes')}{' '}
        <Text variant="body" color="textMuted">
          {t('activity.spots', {
            count: activity.participantCount,
            capacity: activity.capacity,
          })}
        </Text>
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {people.map((p) => (
          <View key={p.id} style={styles.person}>
            <Avatar name={p.firstName} uri={p.avatarUrl} size="md" />
            <Text variant="caption" numberOfLines={1}>
              {p.id === viewerId ? t('activity.you') : p.firstName}
            </Text>
          </View>
        ))}
      </ScrollView>
      {activity.firstTimerCount > 0 ? (
        <Text variant="caption" color="secondary">
          {t('activity.firstTimers', { count: activity.firstTimerCount })}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.spacing.md },
  row: { gap: t.spacing.lg },
  person: { alignItems: 'center', gap: t.spacing.xs, width: 56 },
}));
