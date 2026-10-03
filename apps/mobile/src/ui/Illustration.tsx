import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import type { ActivityCategory } from '@lokky/shared';
import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { CATEGORY_COVERS, ILLUSTRATIONS, type IllustrationName } from '@/assets/illustrations';
import { stableIndex } from '@/lib/variant';

export type { IllustrationName };
export const hasIllustration = (name: IllustrationName) => ILLUSTRATIONS[name] !== undefined;

// Couverture peinte d'une activité, ou null tant que la catégorie n'en a aucune.
// key (l'identifiant de l'activité) fixe la variante : une sortie garde toujours la même image.
export function categoryCover(category: ActivityCategory, key: string): ImageSourcePropType | null {
  const covers = CATEGORY_COVERS[category];
  return covers[stableIndex(key, covers.length)] ?? null;
}

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
