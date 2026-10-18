import { Camera } from 'phosphor-react-native/src/icons/Camera';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Avatar, Button, Text, useToast } from '@/ui';
import { pickAvatar } from '../avatar';

export function AvatarPicker({
  name,
  uri,
  onChange,
  disabled = false,
}: {
  name: string;
  uri: string | null;
  onChange: (uri: string) => void;
  disabled?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const [isPicking, setIsPicking] = useState(false);

  const choosePhoto = async () => {
    setIsPicking(true);
    try {
      const selected = await pickAvatar();
      if (selected) onChange(selected);
    } catch (error) {
      if (__DEV__) console.error('[Avatar] Photo selection failed.', error);
      toast.show(t('onboarding.errors.photo'), 'error');
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Avatar name={name} uri={uri} size="xl" />
      <Button
        label={t(uri ? 'onboarding.you.changePhoto' : 'onboarding.you.photo')}
        size="sm"
        variant="secondary"
        icon={<Camera size={18} color={colors.action} weight="bold" />}
        accessibilityHint={t('onboarding.you.photoHint')}
        disabled={disabled}
        loading={isPicking}
        onPress={choosePhoto}
      />
      <Text variant="caption" color="textMuted">
        {t('onboarding.you.photoHint')}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { alignItems: 'center', gap: t.spacing.sm },
}));
