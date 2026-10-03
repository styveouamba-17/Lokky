import { Image } from 'expo-image';
import { Camera } from 'phosphor-react-native/src/icons/Camera';
import { Pressable, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Text, useToast } from '@/ui';
import { pickAvatar } from '../avatar';

const SIZE = 96;

export function AvatarPicker({
  uri,
  onChange,
}: {
  uri: string | null;
  onChange: (uri: string) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const label = uri ? t('onboarding.you.changePhoto') : t('onboarding.you.photo');

  const choose = async () => {
    try {
      const picked = await pickAvatar();
      if (picked) onChange(picked);
    } catch {
      toast.show(t('onboarding.errors.photo'), 'error');
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={choose}
        style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <Camera size={32} color={colors.textMuted} weight="fill" />
        )}
      </Pressable>
      <View style={styles.copy}>
        <Text variant="label" color="action" onPress={choose} accessibilityElementsHidden>
          {label}
        </Text>
        <Text variant="caption" color="textMuted">
          {t('onboarding.you.photoHint')}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: t.colors.surfaceMuted,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: t.colors.border,
  },
  image: { width: SIZE, height: SIZE },
  pressed: { opacity: 0.85 },
  copy: { flex: 1, gap: t.spacing.xs },
}));
