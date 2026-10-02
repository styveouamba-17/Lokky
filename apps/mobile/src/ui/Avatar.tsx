import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

export const AVATAR_SIZES = { sm: 28, md: 40, lg: 56, xl: 96 } as const;
export type AvatarSize = keyof typeof AVATAR_SIZES;

// Couleurs de marque fixes (identiques en clair et en sombre), contraste vérifié par les tests.
export const AVATAR_TONES = [
  { bg: '#FFE1D6', fg: '#8A2E12' },
  { bg: '#D5F2EF', fg: '#035E57' },
  { bg: '#FFF0C9', fg: '#6B4700' },
  { bg: '#E5E7EB', fg: '#1F2937' },
] as const;

export function avatarTone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? AVATAR_TONES[0];
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function Avatar({
  name,
  uri,
  size = 'md',
}: {
  name: string;
  uri: string | null;
  size?: AvatarSize;
}) {
  const d = AVATAR_SIZES[size];
  const frame = { width: d, height: d, borderRadius: d / 2 };

  if (uri) {
    return (
      <Image
        testID="avatar-image"
        source={{ uri }}
        style={frame}
        contentFit="cover"
        transition={150}
        accessible
        accessibilityLabel={name}
      />
    );
  }
  const tone = avatarTone(name);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[frame, styles.center, { backgroundColor: tone.bg }]}
    >
      <Text
        variant="label"
        maxFontSizeMultiplier={1}
        style={{ color: tone.fg, fontSize: d * 0.42, lineHeight: d * 0.52 }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
