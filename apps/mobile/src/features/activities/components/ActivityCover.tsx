import type { ActivityCategory } from '@lokky/shared';
import { Image } from 'expo-image';
import { makeStyles } from '@/theme';
import { Badge, CATEGORY_ICONS, categoryCover } from '@/ui';
import { useTranslation } from '@/i18n';

// Couverture peinte d'une activité (spec §3), choisie parmi les variantes de sa catégorie.
// Rien tant que la catégorie n'a pas d'illustration : la carte s'affiche alors sans bandeau.
export function ActivityCover({
  activity,
  height,
}: {
  activity: { id: string; category: ActivityCategory };
  height: number;
}) {
  const styles = useStyles();
  const source = categoryCover(activity.category, activity.id);
  if (!source) return null;
  return (
    <Image
      source={source}
      contentFit="cover"
      transition={150}
      accessible={false}
      style={[styles.cover, { height }]}
    />
  );
}

export const hasActivityCover = (activity: { id: string; category: ActivityCategory }) =>
  categoryCover(activity.category, activity.id) !== null;

// Puce de catégorie : icône et nom, en tête du contenu de la carte et du détail.
export function CategoryTag({ category }: { category: ActivityCategory }) {
  const { t } = useTranslation();
  return (
    <Badge label={t(`categories.${category}`)} icon={CATEGORY_ICONS[category]} tone="neutral" />
  );
}

const useStyles = makeStyles((t) => ({
  cover: { width: '100%', backgroundColor: t.colors.surfaceMuted },
}));
