import { z } from 'zod';
import { idSchema } from './schemas/common';

// Données jointes à chaque notification push : elles disent quel écran ouvrir au toucher.
// Le texte affiché (titre, corps) est rédigé par le serveur, dans la langue de l'utilisateur.
export const pushDataSchema = z.discriminatedUnion('type', [
  // Nouveau message dans un groupe ou en privé.
  z.object({ type: z.literal('message'), conversationId: idSchema }),
  // Quelqu'un rejoint ta sortie.
  z.object({ type: z.literal('activity_joined'), activityId: idSchema }),
  // Une sortie où tu vas a changé (description, point de RDV).
  z.object({ type: z.literal('activity_updated'), activityId: idSchema }),
  z.object({ type: z.literal('activity_cancelled'), activityId: idSchema }),
  // Rappel avant la sortie.
  z.object({ type: z.literal('activity_reminder'), activityId: idSchema }),
  // Après la sortie : laisser un avis (participant) ou indiquer qui est venu (créateur).
  z.object({ type: z.literal('after_activity'), activityId: idSchema }),
]);

export type PushData = z.infer<typeof pushDataSchema>;
