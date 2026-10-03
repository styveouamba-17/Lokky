import { z } from 'zod';
import { LIMITS } from '../constants';
import { idSchema, isoDateTimeSchema, paginationQuerySchema } from './common';
import { userPreviewSchema } from './user';

export const messageSchema = z.object({
  id: idSchema,
  clientId: z.string().nullable(),
  conversationId: idSchema,
  sender: userPreviewSchema.nullable(), // null pour un message système
  type: z.enum(['text', 'system']),
  body: z.string().min(1).max(LIMITS.message.bodyMax),
  createdAt: isoDateTimeSchema,
});

export const conversationSchema = z
  .object({
    id: idSchema,
    type: z.enum(['group', 'direct']),
    activityId: idSchema.nullable(),
    // Conversation privée : l'autre personne (null pour un groupe).
    peer: userPreviewSchema.nullable(),
    title: z.string().min(1),
    avatarUrl: z.url().nullable(),
    lastMessage: messageSchema.nullable(),
    unreadCount: z.number().int().nonnegative(),
    isReadOnly: z.boolean(),
    updatedAt: isoDateTimeSchema,
  })
  .refine((c) => (c.type === 'group') === (c.activityId !== null), {
    message: 'errors.group_requires_activity',
  })
  .refine((c) => (c.type === 'direct') === (c.peer !== null), {
    message: 'errors.direct_requires_peer',
  });

export const sendMessageInputSchema = z.object({
  conversationId: idSchema,
  clientId: z.string().min(8).max(64),
  body: z.string().trim().min(1).max(LIMITS.message.bodyMax),
});

export const messageListQuerySchema = paginationQuerySchema.extend({ conversationId: idSchema });

export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type SendMessageInput = z.input<typeof sendMessageInputSchema>;
