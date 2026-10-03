import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

// Connexion du téléphone (spec §7.5) : bannière hors-ligne et file d'envoi des messages.
export const useNetworkStore = create<{ online: boolean }>()(() => ({ online: true }));

// « Réseau inconnu » compte comme en ligne : seul un hors-ligne certain bloque les envois.
export const isOnline = (state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>) =>
  state.isConnected !== false && state.isInternetReachable !== false;

// À appeler une fois au démarrage (app/_layout.tsx) ; renvoie la fonction d'arrêt.
export function watchNetwork(): () => void {
  return NetInfo.addEventListener((state) => useNetworkStore.setState({ online: isOnline(state) }));
}
