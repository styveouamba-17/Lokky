import { UserCircle } from 'phosphor-react-native/src/icons/UserCircle';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';

const SIZE = 96;

export function AvatarPlaceholder() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('onboarding.you.photoUnavailable')}
      style={styles.circle}
    >
      <UserCircle size={48} color={colors.textMuted} weight="regular" />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: t.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
}));
