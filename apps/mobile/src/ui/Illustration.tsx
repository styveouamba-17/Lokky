import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import type { ImageStyle, StyleProp } from 'react-native';
import { ILLUSTRATIONS, type IllustrationName } from '@/assets/illustrations';

export type { IllustrationName };
export const hasIllustration = (name: IllustrationName) => ILLUSTRATIONS[name] !== undefined;

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
