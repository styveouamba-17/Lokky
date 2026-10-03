import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export type PermissionKind = 'location' | 'notifications';
export type PermissionState = 'undetermined' | 'granted' | 'denied';

const normalize = (status: string): PermissionState =>
  status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';

// Localisation : uniquement pendant l'utilisation de l'app (spec §7.4).
export async function getPermission(kind: PermissionKind): Promise<PermissionState> {
  const { status } =
    kind === 'location'
      ? await Location.getForegroundPermissionsAsync()
      : await Notifications.getPermissionsAsync();
  return normalize(status);
}

export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
  const { status } =
    kind === 'location'
      ? await Location.requestForegroundPermissionsAsync()
      : await Notifications.requestPermissionsAsync();
  return normalize(status);
}
