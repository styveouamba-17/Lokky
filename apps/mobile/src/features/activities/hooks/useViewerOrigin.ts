import { haversineKm, NEIGHBORHOODS, type Coordinates } from '@lokky/shared';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useSessionStore } from '@/state/session';

// Position pour trier et filtrer les sorties (spec §7.4) : GPS si l'utilisateur l'a
// autorisé et qu'on est à Dakar, sinon le quartier déclaré à l'onboarding (l'app est
// mono-ville, spec §1). Jamais de demande d'autorisation ici.
const DAKAR_CENTER: Coordinates = { lat: 14.7167, lng: -17.4677 };
const DAKAR_RADIUS_KM = 40;
export const isInDakar = (point: Coordinates) =>
  haversineKm(point, DAKAR_CENTER) <= DAKAR_RADIUS_KM;

async function readDevicePosition(): Promise<Coordinates | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const position =
    (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

export function useViewerOrigin() {
  const neighborhood = useSessionStore((s) => s.me?.neighborhood);
  const device = useQuery({
    queryKey: ['device-position'],
    queryFn: readDevicePosition,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const fallback = neighborhood ? NEIGHBORHOODS[neighborhood].coordinates : null;
  const gps = device.data && isInDakar(device.data) ? device.data : null;
  return {
    origin: gps ?? fallback,
    ready: !device.isPending,
  };
}
