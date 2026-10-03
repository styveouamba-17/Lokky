import type { ActivityCategory } from '@lokky/shared';
import { BookOpen } from 'phosphor-react-native/src/icons/BookOpen';
import { Coffee } from 'phosphor-react-native/src/icons/Coffee';
import { DiceFive } from 'phosphor-react-native/src/icons/DiceFive';
import { FilmSlate } from 'phosphor-react-native/src/icons/FilmSlate';
import { MusicNotes } from 'phosphor-react-native/src/icons/MusicNotes';
import { Palette } from 'phosphor-react-native/src/icons/Palette';
import { PersonSimpleWalk } from 'phosphor-react-native/src/icons/PersonSimpleWalk';
import { SoccerBall } from 'phosphor-react-native/src/icons/SoccerBall';
import { Waves } from 'phosphor-react-native/src/icons/Waves';
import type { IconComponent } from './icons';

// Icône de chaque catégorie : puces de filtre, centres d'intérêt, couvertures.
export const CATEGORY_ICONS: Record<ActivityCategory, IconComponent> = {
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
