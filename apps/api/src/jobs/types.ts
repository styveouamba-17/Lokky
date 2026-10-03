// Tâches planifiées (spec backend §10). Chaque tâche est idempotente : rejouée, elle ne
// renvoie pas deux fois la même notification.
export interface JobPayloads {
  // Rappel 2 h avant la sortie, aux participants.
  'activity-reminder': { activityId: string };
  // Après la sortie : avis (participants) et présence (créateur).
  'after-activity': { activityId: string };
  // Événement d'une sortie à annoncer tout de suite.
  'activity-event': {
    activityId: string;
    kind: 'joined' | 'updated' | 'cancelled';
    userId?: string; // qui a rejoint
  };
  // Nouveaux messages pour une personne, regroupés par conversation.
  'message-push': { conversationId: string; userId: string };
  // Chaque nuit : comptes supprimés depuis 30 jours, codes et sessions expirés.
  'purge-deleted-accounts': Record<string, never>;
  cleanup: Record<string, never>;
}

export type JobName = keyof JobPayloads;

export interface JobScheduler {
  // jobId identique : la tâche n'est créée qu'une fois (regroupement, pas de doublon).
  schedule<N extends JobName>(
    name: N,
    data: JobPayloads[N],
    options?: { runAt?: Date; jobId?: string },
  ): Promise<void>;
  cancel(jobId: string): Promise<void>;
}

export const jobIds = {
  reminder: (activityId: string) => `reminder-${activityId}`,
  after: (activityId: string) => `after-${activityId}`,
  messages: (conversationId: string, userId: string) => `messages-${conversationId}-${userId}`,
};
