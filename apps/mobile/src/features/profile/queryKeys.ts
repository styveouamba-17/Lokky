export const profileKeys = {
  user: (id: string) => ['users', id] as const,
  activities: (id: string) => ['users', id, 'activities'] as const,
};
