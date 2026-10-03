import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '@/i18n';
import { makeStyles, radius, useTheme } from '@/theme';
import { Button } from '@/ui';
import { isAppleSignInAvailable, type OAuthProvider } from '../providers';

const BUTTON_HEIGHT = 56; // même hauteur que Button size="lg"

// Bouton Apple : composant officiel imposé par les règles de l'App Store, iOS uniquement.
export function SocialButtons({
  onPress,
  pending,
}: {
  onPress: (provider: OAuthProvider) => void;
  pending: OAuthProvider | null;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const { t } = useTranslation();
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable, () => setAppleAvailable(false));
  }, []);

  return (
    <View style={styles.stack}>
      {appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            theme.scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={radius.md}
          style={[styles.apple, pending !== null && styles.inactive]}
          onPress={() => {
            if (pending === null) onPress('apple');
          }}
        />
      ) : null}
      <Button
        label={t('login.google')}
        variant="secondary"
        size="lg"
        fullWidth
        loading={pending === 'google'}
        disabled={pending !== null}
        icon={<GoogleIcon />}
        onPress={() => onPress('google')}
      />
    </View>
  );
}

// Logo « G » de Google, couleurs officielles (couleurs de marque tierces, hors tokens).
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </Svg>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.spacing.md, alignSelf: 'stretch' },
  apple: { height: BUTTON_HEIGHT, width: '100%' },
  inactive: { opacity: 0.5 },
}));
