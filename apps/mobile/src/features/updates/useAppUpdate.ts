import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

// Au lancement, expo-updates vérifie et télécharge seul la mise à jour OTA, mais ne l'applique
// qu'au lancement suivant. On revérifie aussi au retour au premier plan (l'app reste souvent
// ouverte des jours en arrière-plan) et on signale quand une version est prête.
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function useAppUpdate() {
  const { isUpdatePending } = Updates.useUpdates();
  const lastCheck = useRef(0);

  useEffect(() => {
    if (!Updates.isEnabled || __DEV__) return;
    // Le lancement vient d'être vérifié par expo-updates : pas de second appel tout de suite.
    lastCheck.current = Date.now();
    const check = async () => {
      if (Date.now() - lastCheck.current < CHECK_INTERVAL_MS) return;
      lastCheck.current = Date.now();
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // Réseau absent ou serveur injoignable : nouvel essai au prochain retour dans l'app.
      }
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => subscription.remove();
  }, []);

  return { ready: isUpdatePending, restart: () => Updates.reloadAsync() };
}
