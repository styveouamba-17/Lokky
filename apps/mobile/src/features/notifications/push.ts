import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useActiveConversation } from '@/state/activeConversation';
import { registerPushToken } from './api';
import { isForOpenConversation } from './routes';

// Canal Android par défaut (déclaré aussi dans app.config.ts : defaultChannel).
const ANDROID_CHANNEL = 'default';

// App ouverte : on affiche la notification, sauf un message de la conversation déjà à l'écran.
export function configureForegroundNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const show = !isForOpenConversation(
        notification.request.content.data,
        useActiveConversation.getState().id,
      );
      return {
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: true,
      };
    },
  });
}

// Enregistre le téléphone pour les push (spec §7.4). L'autorisation est proposée pendant
// l'onboarding ; si elle n'a jamais été demandée sur ce téléphone (nouvelle installation d'un
// compte déjà inscrit), on la demande ici, une fois. Un refus n'est jamais redemandé : on
// renvoie vers les réglages du téléphone (Réglages › Notifications de l'app).
// Renvoie false si rien n'a été enregistré.
export async function registerForPushNotifications({
  askIfNeverAsked = false,
}: { askIfNeverAsked?: boolean } = {}): Promise<boolean> {
  if (!Device.isDevice) return false; // pas de push sur simulateur
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Lokky',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status === 'undetermined' && askIfNeverAsked) {
    ({ status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    }));
  }
  if (status !== 'granted') return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
  return true;
}
