import type { RouteName } from '@lokky/shared';
import type { Redis } from 'ioredis';

// Limitation de débit (spec backend §12) : un compteur par fenêtre de temps dans Redis,
// partagé par toutes les instances de l'API. Les routes publiques sont limitées par adresse IP,
// les routes connectées par compte.

export interface RateLimiter {
  // Compte un appel ; renvoie le délai d'attente en secondes si la limite est dépassée.
  hit(key: string, limit: number, windowSeconds: number): Promise<number | null>;
}

export function createRedisRateLimiter(redis: Redis): RateLimiter {
  return {
    async hit(key, limit, windowSeconds) {
      const results = await redis
        .multi()
        .incr(key)
        .expire(key, windowSeconds, 'NX') // la fenêtre démarre au premier appel
        .ttl(key)
        .exec();
      const count = Number(results?.[0]?.[1] ?? 0);
      const ttl = Number(results?.[2]?.[1] ?? windowSeconds);
      return count > limit ? Math.max(1, ttl) : null;
    },
  };
}

interface Policy {
  limit: number;
  windowSeconds: number;
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Routes publiques (connexion) : par adresse IP. À Dakar, beaucoup de monde partage la même IP
// (Wi-Fi d'université, opérateurs mobiles) : ces limites arrêtent un robot, pas un campus.
// La vraie protection du code email est par adresse (1 envoi par minute, 5 essais par code).
export const IP_POLICIES: Partial<Record<RouteName, Policy>> = {
  'auth.emailStart': { limit: 20, windowSeconds: 15 * MINUTE },
  'auth.emailVerify': { limit: 60, windowSeconds: 15 * MINUTE },
  'auth.oauth': { limit: 60, windowSeconds: 15 * MINUTE },
  // Chaque téléphone rafraîchit son jeton toutes les 15 minutes.
  'auth.refresh': { limit: 600, windowSeconds: 15 * MINUTE },
};

// Routes connectées : par compte. Les autres routes ont la limite par défaut.
export const USER_POLICIES: Partial<Record<RouteName, Policy>> = {
  'messages.send': { limit: 30, windowSeconds: MINUTE },
  'messages.update': { limit: 30, windowSeconds: MINUTE },
  'activities.create': { limit: 10, windowSeconds: DAY },
  'activities.join': { limit: 60, windowSeconds: HOUR },
  'activities.leave': { limit: 60, windowSeconds: HOUR },
  'conversations.openDirect': { limit: 30, windowSeconds: HOUR },
  'reports.create': { limit: 20, windowSeconds: DAY },
  'blocks.create': { limit: 50, windowSeconds: DAY },
  'me.avatarUploadUrl': { limit: 20, windowSeconds: HOUR },
};

export const DEFAULT_USER_POLICY: Policy = { limit: 300, windowSeconds: MINUTE };
export const DEFAULT_IP_POLICY: Policy = { limit: 300, windowSeconds: MINUTE };

export function policyFor(route: RouteName, viewerId: string | null) {
  if (!viewerId) {
    const policy = IP_POLICIES[route] ?? DEFAULT_IP_POLICY;
    return { policy, scope: 'ip' as const };
  }
  return { policy: USER_POLICIES[route] ?? DEFAULT_USER_POLICY, scope: 'user' as const };
}
