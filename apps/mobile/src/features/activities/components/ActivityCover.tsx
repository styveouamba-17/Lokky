import type { ActivityCategory } from '@lokky/shared';
import { Image } from 'expo-image';
import { makeStyles } from '@/theme';
import { activityCover, Badge, CATEGORY_ICONS } from '@/ui';
import { useTranslation } from '@/i18n';

type CoveredActivity = { id: string; category: ActivityCategory; cover?: string | null };

// Couverture peinte d'une activité (spec §3) : celle choisie par le créateur, sinon une image
// de sa catégorie. Rien si la catégorie n'a pas d'illustration : la carte s'affiche sans bandeau.
export function ActivityCover({ activity, height }: { activity: CoveredActivity; height: number }) {
  const styles = useStyles();
  const cover = activityCover(activity);
  if (!cover) return null;
  return (
    <Image
      source={cover.source}
      contentFit="cover"
      contentPosition={{ top: `${cover.focusY}%`, left: '50%' }}
      transition={150}
      accessible={false}
      style={[styles.cover, { height }]}
    />
  );
}

export const hasActivityCover = (activity: CoveredActivity) => activityCover(activity) !== null;

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
