import { BellRinging } from 'phosphor-react-native/src/icons/BellRinging';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { Button, Illustration, OptionCard, StepIntro, Text, type IconComponent } from '@/ui';
import {
  getPermission,
  requestPermission,
  type PermissionKind,
  type PermissionState,
} from '../permissions';

// Les deux autorisations sont facultatives : sans position, on se rabat sur le quartier.
export function StepPermissions() {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.stack}>
      <Illustration name="onboarding-permissions" style={styles.artwork} />
      <StepIntro
        title={t('onboarding.permissions.title')}
        body={t('onboarding.permissions.body')}
      />
      <PermissionCard
        kind="location"
        icon={MapPin}
        title={t('onboarding.permissions.location')}
        body={t('onboarding.permissions.locationBody')}
      />
      <PermissionCard
        kind="notifications"
        icon={BellRinging}
        title={t('onboarding.permissions.notifications')}
        body={t('onboarding.permissions.notificationsBody')}
      />
    </View>
  );
}

function PermissionCard({
  kind,
  icon,
  title,
  body,
}: {
  kind: PermissionKind;
  icon: IconComponent;
  title: string;
  body: string;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<PermissionState>('undetermined');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    getPermission(kind).then(setState, () => setState('undetermined'));
  }, [kind]);

  const ask = async () => {
    setAsking(true);
    try {
      setState(await requestPermission(kind));
    } finally {
      setAsking(false);
    }
  };

  return (
    <OptionCard
      icon={icon}
      title={title}
      body={body}
      role="none"
      right={
        state === 'undetermined' ? (
          <Button
            label={t('onboarding.permissions.allow')}
            size="sm"
            loading={asking}
            onPress={ask}
          />
        ) : (
          <Text variant="label" color={state === 'granted' ? 'success' : 'textMuted'}>
            {state === 'granted'
              ? t('onboarding.permissions.granted')
              : t('onboarding.permissions.denied')}
          </Text>
        )
      }
    />
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.lg },
  artwork: { maxWidth: 260, alignSelf: 'center' },
}));
