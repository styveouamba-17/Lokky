import type { ActivityCategory } from '@lokky/shared';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { makeStyles, palette } from '@/theme';
import { CATEGORY_ICONS, hasIllustration, Illustration } from '@/ui';

// Couverture par défaut d'une activité (spec §3 : illustration de catégorie). En attendant
// les illustrations peintes (spec §12, point 4) : aplat de marque, icône et vague.
// fg : couleur de l'icône, claire sur les fonds foncés, Charbon sur les fonds clairs.
const TONES: Record<ActivityCategory, { bg: string; wave: string; fg: string }> = {
  sport: { bg: palette.ocean, wave: palette.oceanDeep, fg: palette.white },
  beach: { bg: palette.soleil, wave: palette.ocean, fg: palette.charbon },
  cinema: { bg: palette.charbon, wave: palette.corniche, fg: palette.white },
  study: { bg: palette.oceanDeep, wave: palette.oceanLight, fg: palette.white },
  music: { bg: palette.corniche, wave: palette.soleil, fg: palette.white },
  games: { bg: palette.cornicheDeep, wave: palette.soleil, fg: palette.white },
  food: { bg: palette.soleil, wave: palette.corniche, fg: palette.charbon },
  culture: { bg: palette.charbonLight, wave: palette.oceanLight, fg: palette.white },
  walk: { bg: palette.oceanLight, wave: palette.ocean, fg: palette.charbon },
};

export function ActivityCover({
  category,
  height,
  children,
}: {
  category: ActivityCategory;
  height: number;
  children?: ReactNode; // badges posés sur la couverture
}) {
  const styles = useStyles();
  const tone = TONES[category];
  const Icon = CATEGORY_ICONS[category];
  const disc = height * 0.5;
  const artwork = `category-${category}` as const;

  // Illustration peinte de la catégorie, dès qu'elle est livrée (docs/illustrations.md).
  if (hasIllustration(artwork)) {
    return (
      <View style={[styles.cover, { height, backgroundColor: tone.bg }]}>
        <Illustration name={artwork} contentFit="cover" style={styles.artwork} />
        {children ? <View style={styles.overlay}>{children}</View> : null}
      </View>
    );
  }

  return (
    <View style={[styles.cover, { height, backgroundColor: tone.bg }]}>
      <Svg
        style={styles.wave}
        width="100%"
        height={height * 0.45}
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
      >
        <Path
          d="M0 18 C 20 6, 35 6, 55 16 S 85 26, 100 12 L100 30 L0 30 Z"
          fill={tone.wave}
          opacity={0.55}
        />
      </Svg>
      <View
        style={[styles.disc, { width: disc, height: disc }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <View style={styles.veil} />
        <Icon size={disc * 0.6} color={tone.fg} weight="duotone" />
      </View>
      {children ? <View style={styles.overlay}>{children}</View> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  cover: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  wave: { position: 'absolute', bottom: 0, left: 0 },
  artwork: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  disc: { alignItems: 'center', justifyContent: 'center' },
  // Voile clair derrière l'icône, sur un calque à part pour ne pas l'estomper.
  veil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: t.radius.full,
    backgroundColor: palette.white,
    opacity: 0.22,
  },
  overlay: {
    position: 'absolute',
    top: t.spacing.md,
    left: t.spacing.md,
    right: t.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.xs,
  },
}));
