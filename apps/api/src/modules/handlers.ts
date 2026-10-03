import type { Handlers } from '../http/context';
import { activitiesHandlers } from './activities/handlers';
import { authHandlers } from './auth/handlers';
import { chatHandlers } from './chat/handlers';
import { pushHandlers } from './push/handlers';
import { safetyHandlers } from './safety/handlers';
import { trustHandlers } from './trust/handlers';
import { usersHandlers } from './users/handlers';
import { profileHandlers } from './users/profileHandlers';

// Handlers de toutes les routes du contrat, module par module (spec backend §15) :
// B2 auth et users, B3 activities, B4 chat, B5 trust et safety, B6 push.
// Une route absente répond 501.
export const handlers: Handlers = {
  ...authHandlers,
  ...usersHandlers,
  ...profileHandlers,
  ...activitiesHandlers,
  ...chatHandlers,
  ...trustHandlers,
  ...safetyHandlers,
  ...pushHandlers,
};
