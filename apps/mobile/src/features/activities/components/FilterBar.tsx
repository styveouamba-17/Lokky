import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@lokky/shared';
import { Confetti } from 'phosphor-react-native/src/icons/Confetti';
import { SunHorizon } from 'phosphor-react-native/src/icons/SunHorizon';
import { Tag } from 'phosphor-react-native/src/icons/Tag';
import { ScrollView } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { CATEGORY_ICONS, Chip } from '@/ui';

export interface FeedFilters {
  when: 'tonight' | 'weekend' | 'all';
  freeOnly: boolean;
  categories: ActivityCategory[];
}

export const DEFAULT_FILTERS: FeedFilters = { when: 'all', freeOnly: false, categories: [] };

// Puces Ce soir · Ce week-end · Gratuit, puis catégories (spec §6.2).
export function FilterBar({
  filters,
  onChange,
}: {
  filters: FeedFilters;
  onChange: (filters: FeedFilters) => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const toggleWhen = (when: 'tonight' | 'weekend') =>
    onChange({ ...filters, when: filters.when === when ? 'all' : when });
  const toggleCategory = (category: ActivityCategory) =>
    onChange({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Chip
        label={t('discover.filters.tonight')}
        icon={SunHorizon}
        selected={filters.when === 'tonight'}
        onPress={() => toggleWhen('tonight')}
      />
      <Chip
        label={t('discover.filters.weekend')}
        icon={Confetti}
        selected={filters.when === 'weekend'}
        onPress={() => toggleWhen('weekend')}
      />
      <Chip
        label={t('discover.filters.free')}
        icon={Tag}
        selected={filters.freeOnly}
        onPress={() => onChange({ ...filters, freeOnly: !filters.freeOnly })}
      />
      {ACTIVITY_CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={t(`categories.${category}`)}
          icon={CATEGORY_ICONS[category]}
          selected={filters.categories.includes(category)}
          onPress={() => toggleCategory(category)}
        />
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  row: { gap: t.spacing.sm, paddingHorizontal: t.spacing.screen, paddingVertical: t.spacing.xs },
}));
