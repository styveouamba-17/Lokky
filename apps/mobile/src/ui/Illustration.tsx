import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ACTIVITY_COVERS, type ActivityCategory, type ActivityCover } from '@lokky/shared';
import type { ImageStyle, StyleProp } from 'react-native';
import {
  COVER_IMAGES,
  ILLUSTRATIONS,
  type CoverImage,
  type IllustrationName,
} from '@/assets/illustrations';
import { stableIndex } from '@/lib/variant';

export type { CoverImage, IllustrationName };
export const hasIllustration = (name: IllustrationName) => ILLUSTRATIONS[name] !== undefined;

const isKnownCover = (id: string | null | undefined): id is ActivityCover =>
  !!id && Object.hasOwn(COVER_IMAGES, id);

// Couverture d'une activité : celle choisie par le créateur, sinon (automatique, ou image
// inconnue de cette version de l'app) une image de sa catégorie, ou null s'il n'y en a pas.
// key (l'identifiant de l'activité) fixe la variante : une sortie garde toujours la même image.
export function activityCover(activity: {
  id: string;
  category: ActivityCategory;
  cover?: string | null;
}): CoverImage | null {
  if (isKnownCover(activity.cover)) return COVER_IMAGES[activity.cover];
  const auto = ACTIVITY_COVERS.filter(
    (id) => COVER_IMAGES[id].auto && COVER_IMAGES[id].categories.includes(activity.category),
  );
  const id = auto[stableIndex(activity.id, auto.length)];
  return id ? COVER_IMAGES[id] : null;
}

// Galerie : d'abord les images pensées pour la catégorie, puis toutes les autres.
export function coverChoices(category: ActivityCategory): {
  suggested: ActivityCover[];
  others: ActivityCover[];
} {
  const suggested = ACTIVITY_COVERS.filter((id) => COVER_IMAGES[id].categories.includes(category));
  return { suggested, others: ACTIVITY_COVERS.filter((id) => !suggested.includes(id)) };
}

export const coverImage = (id: ActivityCover) => COVER_IMAGES[id];

// Illustration peinte si elle est livrée, sinon le visuel de remplacement fourni.
// Décorative : le titre et le texte qui l'accompagnent portent le message.
export function Illustration({
  name,
  fallback = null,
  aspectRatio = 4 / 3,
  contentFit = 'contain',
  style,
}: {
  name: IllustrationName;
  fallback?: ReactNode;
  aspectRatio?: number;
  contentFit?: 'contain' | 'cover';
  style?: StyleProp<ImageStyle>;
}) {
  const source = ILLUSTRATIONS[name];
  if (!source) return <>{fallback}</>;
  return (
    <Image
      source={source}
      contentFit={contentFit}
      transition={150}
      accessible={false}
      style={[{ width: '100%', aspectRatio }, style]}
    />
  );
}
