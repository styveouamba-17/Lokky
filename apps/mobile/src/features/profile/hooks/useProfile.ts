import { useQuery } from '@tanstack/react-query';
import { getUser, listUserActivities } from '../api';
import { profileKeys } from '../queryKeys';

export const useUser = (id: string) =>
  useQuery({ queryKey: profileKeys.user(id), queryFn: () => getUser(id), enabled: id !== '' });

// Première page seulement : un profil montre quelques prochaines sorties, pas un fil complet.
export const useOrganizedActivities = (id: string) =>
  useQuery({
    queryKey: profileKeys.activities(id),
    queryFn: () => listUserActivities(id),
    select: (page) => page.items,
    enabled: id !== '',
  });
