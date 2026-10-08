import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

let unsupportedLauncherReported = false;

export function useAppBadgeCount(count: number) {
  useEffect(() => {
    void Notifications.setBadgeCountAsync(count)
      .then((supported) => {
        if (!supported && !unsupportedLauncherReported) {
          unsupportedLauncherReported = true;
          console.info('[Lokky] Ce lanceur ne prend pas en charge le badge de l’icône.');
        }
      })
      .catch((error: unknown) => {
        console.warn('[Lokky] Impossible de mettre à jour le badge de l’icône.', error);
      });
  }, [count]);

  useEffect(() => {
    return () => {
      void Notifications.setBadgeCountAsync(0).catch((error: unknown) => {
        console.warn('[Lokky] Impossible d’effacer le badge de l’icône.', error);
      });
    };
  }, []);
}
