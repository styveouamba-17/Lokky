import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { registerForPushNotifications } from '../push';
import { hrefForPush } from '../routes';

const open = (response: Notifications.NotificationResponse | null) => {
  const href = response ? hrefForPush(response.notification.request.content.data) : null;
  if (href) router.push(href);
};

// Monté avec les onglets, donc seulement une fois connecté : enregistre le téléphone, puis
// ouvre le bon écran quand on touche une notification (app ouverte ou lancée par elle).
export function usePushNotifications() {
  useEffect(() => {
    // Au mieux : un échec est rattrapé au prochain retour au premier plan.
    registerForPushNotifications({ askIfNeverAsked: true }).catch(() => undefined);

    // Retour dans l'app (après la fenêtre d'autorisation d'iOS, ou les réglages du téléphone) :
    // l'autorisation a pu changer, on réenregistre (sans redemander).
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerForPushNotifications().catch(() => undefined);
    });

    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last);
      Notifications.clearLastNotificationResponse();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => {
      subscription.remove();
      appState.remove();
    };
  }, []);
}
