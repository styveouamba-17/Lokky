import type { EventBus } from './events';

// Le bus d'événements de domaine est attaché à l'app Fastify (app.ts).
declare module 'fastify' {
  interface FastifyInstance {
    events: EventBus;
  }
}
