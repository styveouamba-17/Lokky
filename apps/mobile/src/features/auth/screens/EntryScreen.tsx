import { Redirect, type Href } from 'expo-router';
import { useSessionStore, type SessionStatus } from '@/state/session';

// Point d'entrée et cible des redirections de la garde (app/_layout.tsx).
// La session est déjà relue : la racine attend `status !== 'unknown'` avant d'afficher.
const DESTINATIONS: Record<Exclude<SessionStatus, 'unknown'>, Href> = {
  signedOut: '/welcome',
  onboarding: '/onboarding',
  signedIn: '/discover',
  suspended: '/suspended',
  banned: '/banned',
};

export function EntryScreen() {
  const status = useSessionStore((s) => s.status);
  if (status === 'unknown') return null;
  return <Redirect href={DESTINATIONS[status]} />;
}
