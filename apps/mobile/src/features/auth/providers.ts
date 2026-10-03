import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Connexion native Apple / Google : on récupère un jeton d'identité que le backend vérifiera
// (en mode mock, le client simulé l'accepte tel quel). Pas de Firebase Auth (décision J2).
export type OAuthProvider = 'apple' | 'google';
export interface OAuthCredential {
  provider: OAuthProvider;
  idToken: string;
  firstName?: string;
}

// Identifiants OAuth publics (non secrets), ceux du projet Firebase de l'ancienne app.
const GOOGLE_WEB_CLIENT_ID =
  '421092754029-qio486739a47igklo9dagdg02a33peku.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID =
  '421092754029-gqckmi8meuc1vitatmnrg33cp470io4q.apps.googleusercontent.com';

const cleanFirstName = (name: string | null | undefined) => {
  const trimmed = name?.trim().slice(0, 30);
  return trimmed ? { firstName: trimmed } : {};
};

export async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

// null : l'utilisateur a annulé (pas une erreur à afficher).
export async function signInWithApple(): Promise<OAuthCredential | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('Apple : jeton d’identité absent.');
    // Apple ne transmet le prénom qu'à la toute première connexion.
    return {
      provider: 'apple',
      idToken: credential.identityToken,
      ...cleanFirstName(credential.fullName?.givenName),
    };
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
}

let googleConfigured = false;

export async function signInWithGoogle(): Promise<OAuthCredential | null> {
  if (!googleConfigured) {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
    googleConfigured = true;
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;
    const { idToken, user } = response.data;
    if (!idToken) throw new Error('Google : jeton d’identité absent.');
    return { provider: 'google', idToken, ...cleanFirstName(user.givenName) };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw error;
  }
}
