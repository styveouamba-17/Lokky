import { z } from 'zod';
import {
  activityListQuerySchema,
  activitySchema,
  createActivityInputSchema,
  myActivitiesQuerySchema,
  updateActivityInputSchema,
} from '../schemas/activity';
import {
  authResultSchema,
  authTokensSchema,
  avatarUploadInputSchema,
  avatarUploadOutputSchema,
  emailStartInputSchema,
  emailVerifyInputSchema,
  oauthInputSchema,
  pushTokenInputSchema,
  refreshInputSchema,
} from '../schemas/auth';
import {
  conversationSchema,
  messageListQuerySchema,
  messageSchema,
  sendMessageInputSchema,
} from '../schemas/chat';
import {
  emptyInputSchema,
  idSchema,
  okSchema,
  paginatedSchema,
  paginationQuerySchema,
} from '../schemas/common';
import {
  attendanceInputSchema,
  blockedUserSchema,
  blockInputSchema,
  reportInputSchema,
  reviewInputSchema,
} from '../schemas/safety';
import {
  meSchema,
  onboardingProfileSchema,
  updateMeInputSchema,
  userSchema,
} from '../schemas/user';
import type { HttpMethod } from './request';

export interface RouteDef<I extends z.ZodType = z.ZodType, O extends z.ZodType = z.ZodType> {
  method: HttpMethod;
  path: `/${string}`;
  auth: boolean;
  input: I;
  output: O;
}

const route = <I extends z.ZodType, O extends z.ZodType>(def: RouteDef<I, O>) => def;
const byId = z.object({ id: idSchema });

export const routes = {
  // Connexion
  'auth.emailStart': route({
    method: 'POST',
    path: '/auth/email/start',
    auth: false,
    input: emailStartInputSchema,
    output: okSchema,
  }),
  'auth.emailVerify': route({
    method: 'POST',
    path: '/auth/email/verify',
    auth: false,
    input: emailVerifyInputSchema,
    output: authResultSchema,
  }),
  'auth.oauth': route({
    method: 'POST',
    path: '/auth/oauth',
    auth: false,
    input: oauthInputSchema,
    output: authResultSchema,
  }),
  'auth.refresh': route({
    method: 'POST',
    path: '/auth/refresh',
    auth: false,
    input: refreshInputSchema,
    output: authTokensSchema,
  }),
  'auth.logout': route({
    method: 'POST',
    path: '/auth/logout',
    auth: true,
    input: refreshInputSchema,
    output: okSchema,
  }),

  // Moi
  'me.get': route({
    method: 'GET',
    path: '/me',
    auth: true,
    input: emptyInputSchema,
    output: meSchema,
  }),
  'me.completeOnboarding': route({
    method: 'POST',
    path: '/me/onboarding',
    auth: true,
    input: onboardingProfileSchema,
    output: meSchema,
  }),
  'me.update': route({
    method: 'PATCH',
    path: '/me',
    auth: true,
    input: updateMeInputSchema,
    output: meSchema,
  }),
  'me.delete': route({
    method: 'DELETE',
    path: '/me',
    auth: true,
    input: emptyInputSchema,
    output: okSchema,
  }),
  'me.registerPushToken': route({
    method: 'POST',
    path: '/me/push-token',
    auth: true,
    input: pushTokenInputSchema,
    output: okSchema,
  }),
  'me.avatarUploadUrl': route({
    method: 'POST',
    path: '/me/avatar/upload-url',
    auth: true,
    input: avatarUploadInputSchema,
    output: avatarUploadOutputSchema,
  }),

  // Activités
  'activities.list': route({
    method: 'GET',
    path: '/activities',
    auth: true,
    input: activityListQuerySchema,
    output: paginatedSchema(activitySchema),
  }),
  'activities.mine': route({
    method: 'GET',
    path: '/me/activities',
    auth: true,
    input: myActivitiesQuerySchema,
    output: paginatedSchema(activitySchema),
  }),
  'activities.get': route({
    method: 'GET',
    path: '/activities/:id',
    auth: true,
    input: byId,
    output: activitySchema,
  }),
  'activities.participants': route({
    method: 'GET',
    path: '/activities/:id/participants',
    auth: true,
    input: byId,
    output: z.array(userSchema),
  }),
  'activities.create': route({
    method: 'POST',
    path: '/activities',
    auth: true,
    input: createActivityInputSchema,
    output: activitySchema,
  }),
  'activities.update': route({
    method: 'PATCH',
    path: '/activities/:id',
    auth: true,
    input: updateActivityInputSchema,
    output: activitySchema,
  }),
  'activities.cancel': route({
    method: 'POST',
    path: '/activities/:id/cancel',
    auth: true,
    input: byId,
    output: activitySchema,
  }),
  'activities.join': route({
    method: 'POST',
    path: '/activities/:id/join',
    auth: true,
    input: byId,
    output: activitySchema,
  }),
  'activities.leave': route({
    method: 'POST',
    path: '/activities/:id/leave',
    auth: true,
    input: byId,
    output: activitySchema,
  }),
  'activities.attendance': route({
    method: 'POST',
    path: '/activities/:activityId/attendance',
    auth: true,
    input: attendanceInputSchema,
    output: okSchema,
  }),
  'reviews.create': route({
    method: 'POST',
    path: '/activities/:activityId/reviews',
    auth: true,
    input: reviewInputSchema,
    output: okSchema,
  }),

  // Utilisateurs
  'users.get': route({
    method: 'GET',
    path: '/users/:id',
    auth: true,
    input: byId,
    output: userSchema,
  }),

  // Messagerie
  'conversations.list': route({
    method: 'GET',
    path: '/conversations',
    auth: true,
    input: paginationQuerySchema,
    output: paginatedSchema(conversationSchema),
  }),
  'conversations.get': route({
    method: 'GET',
    path: '/conversations/:id',
    auth: true,
    input: byId,
    output: conversationSchema,
  }),
  'conversations.openDirect': route({
    method: 'POST',
    path: '/conversations/direct',
    auth: true,
    input: z.object({ userId: idSchema }),
    output: conversationSchema,
  }),
  'conversations.markRead': route({
    method: 'POST',
    path: '/conversations/:id/read',
    auth: true,
    input: byId,
    output: okSchema,
  }),
  'messages.list': route({
    method: 'GET',
    path: '/conversations/:conversationId/messages',
    auth: true,
    input: messageListQuerySchema,
    output: paginatedSchema(messageSchema),
  }),
  'messages.send': route({
    method: 'POST',
    path: '/conversations/:conversationId/messages',
    auth: true,
    input: sendMessageInputSchema,
    output: messageSchema,
  }),

  // Sécurité
  'reports.create': route({
    method: 'POST',
    path: '/reports',
    auth: true,
    input: reportInputSchema,
    output: okSchema,
  }),
  'blocks.list': route({
    method: 'GET',
    path: '/me/blocks',
    auth: true,
    input: emptyInputSchema,
    output: z.array(blockedUserSchema),
  }),
  'blocks.create': route({
    method: 'POST',
    path: '/me/blocks',
    auth: true,
    input: blockInputSchema,
    output: okSchema,
  }),
  'blocks.delete': route({
    method: 'DELETE',
    path: '/me/blocks/:userId',
    auth: true,
    input: blockInputSchema,
    output: okSchema,
  }),
} as const;

export type Routes = typeof routes;
export type RouteName = keyof Routes;
export type RouteInput<R extends RouteName> = z.input<Routes[R]['input']>;
export type RouteParsedInput<R extends RouteName> = z.output<Routes[R]['input']>;
export type RouteOutput<R extends RouteName> = z.output<Routes[R]['output']>;
