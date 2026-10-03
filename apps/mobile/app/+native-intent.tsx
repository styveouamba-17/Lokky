import { redirectForLink } from '@/state/pendingLink';

// Liens entrants (spec §6.3, règle 7) : lokky.akylian.com/activity/:id ou lokky://activity/:id.
// Quelqu'un qui n'est pas connecté retrouve la sortie juste après sa connexion.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return redirectForLink(path);
}
