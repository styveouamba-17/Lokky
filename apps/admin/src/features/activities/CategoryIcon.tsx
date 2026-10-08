import type { ActivityCategory } from '@lokky/shared';
import {
  BookOpen,
  Coffee,
  DiceFive,
  FilmSlate,
  MusicNotes,
  Palette,
  PersonSimpleWalk,
  SoccerBall,
  Waves,
  type Icon,
} from '@phosphor-icons/react';
import { CATEGORY_LABELS } from '@/lib/labels';

// Mêmes icônes que l'app (apps/mobile/src/ui/CategoryIcon.tsx).
const ICONS: Record<ActivityCategory, Icon> = {
  sport: SoccerBall,
  beach: Waves,
  cinema: FilmSlate,
  study: BookOpen,
  music: MusicNotes,
  games: DiceFive,
  food: Coffee,
  culture: Palette,
  walk: PersonSimpleWalk,
};

export function CategoryIcon({
  category,
  size = 34,
}: {
  category: ActivityCategory;
  size?: number;
}) {
  const Glyph = ICONS[category];
  return (
    <span
      title={CATEGORY_LABELS[category]}
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: 10,
        display: 'inline-grid',
        placeItems: 'center',
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
      }}
    >
      <Glyph size={size * 0.55} weight="duotone" />
    </span>
  );
}
