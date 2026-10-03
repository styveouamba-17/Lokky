import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const AVATAR_SIZE = 512;

// Choix dans la galerie, recadrage carré, puis compression sur le téléphone (spec §7.4).
// null : l'utilisateur a annulé.
export async function pickAvatar(): Promise<string | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  const asset = picked.canceled ? undefined : picked.assets[0];
  if (!asset) return null;

  const rendered = await ImageManipulator.manipulate(asset.uri)
    .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
    .renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return saved.uri;
}
