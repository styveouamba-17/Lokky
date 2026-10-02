# Lokky mobile — Jalon 1 : fondations — plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:executing-plans (ou superpowers:subagent-driven-development). Les étapes utilisent des cases `- [ ]`.
> **Consigne de l'utilisateur : aucun commit, aucune liste de tâches.** Les étapes « Point de contrôle » remplacent les commits : on y vérifie, on n'y commite pas.

**Objectif :** poser un monorepo propre, avec un contrat d'API partagé et testé, un client d'API (réel + simulé), le thème et tout le design system, visibles dans un écran `/dev/ui` sur une nouvelle app Expo SDK 57.

**Architecture :** monorepo npm workspaces. `packages/shared` contient le contrat (schémas zod, routes, événements temps réel, règles de temps), sans React. `apps/mobile` est une app Expo neuve, organisée en couches `app → features → ui | api | lib | theme | state → @lokky/shared`, avec une règle ESLint qui vérifie le sens des dépendances.

**Stack :** Expo SDK 57, React Native 0.86, expo-router, TypeScript strict, zod 4, TanStack Query 5, Zustand 5, Reanimated 4, react-native-svg, expo-image, phosphor-react-native, Jest (jest-expo) + React Native Testing Library 14, Vitest 5 (package shared).

**Spec :** `docs/superpowers/specs/2026-10-02-lokky-refonte-mobile-design.md`

---

## Feuille de route complète (8 jalons)

Chaque jalon aura son propre plan détaillé, écrit au moment de le commencer, à partir du code réellement en place.

| Jalon | Étapes de la spec (§10) | Contenu |
|---|---|---|
| **J1 (ce plan)** | 1, 2, 3 | Monorepo, outillage, contrat `shared`, client HTTP + client simulé, thème, design system, logo, `/dev/ui`, CI |
| J2 | 4 | i18n (i18next), session (Zustand persisté + SecureStore), refresh token mutualisé, connexion Apple / Google / code email, onboarding 4 étapes, garde de navigation, écrans suspendu / banni |
| J3 | 5 | Découvrir (filtres, FlashList, pagination infinie), localisation + repli sur le quartier, détail d'activité, illustrations provisoires |
| J4 | 6 | Création d'activité en 5 étapes + récapitulatif |
| J5 | 7 | « Je viens ! » optimiste, chat de groupe, `MockSocket`, file d'envoi hors-ligne (NetInfo) |
| J6 | 8 | Mes activités, avis et présence, profils publics |
| J7 | 9 | Messages privés, signalement, blocage, réglages (préférences persistées), suppression de compte |
| J8 | 10 | Push, deep links, Sentry, animations, haptique, finitions |

## Décisions prises dans ce plan (précisions de la spec)

1. **Thème : plan B retenu directement** (spec §12, point 1). Unistyles 3 impose un plugin Babel, `react-native-nitro-modules` et des mocks Jest dédiés. Un `ThemeProvider` + `makeStyles` maison (environ 60 lignes) offre la même API de tokens, fonctionne dans Jest sans configuration et n'ajoute aucune dépendance native.
2. **Dossier `src/state/`** ajouté pour les stores Zustand partagés (préférences, plus tard la session). Il peut être importé par `app/` et `features/`, et n'importe que `theme`, `lib` et `@lokky/shared`. Sans lui, une feature devrait importer une autre feature pour lire une préférence.
3. **« Première fois ? »** : le champ `firstTimerCount` compte les participants (hors utilisateur courant) qui n'ont encore jamais participé à une activité Lokky. Texte prévu en J3 : « Première fois ? N participant·e·s découvrent aussi Lokky ».
4. **Heure de Dakar partout** : Africa/Dakar est à UTC+0 toute l'année (pas d'heure d'été). Tous les calculs et affichages de date utilisent les accesseurs UTC, donc un téléphone réglé sur un autre fuseau affiche quand même l'heure de Dakar.
5. **Formateurs de `lib/` en français uniquement** pour la v1. Ils prendront un paramètre de langue quand l'anglais sera ajouté.
6. **Vitest** pour `packages/shared` (TypeScript pur, sans React Native), **Jest** pour l'app.
7. **Icône d'app provisoire** : l'ancienne icône est reprise jusqu'à l'export PNG du nouveau logo.
8. **Le client simulé ne couvre au J1 que** `activities.list`, `activities.get` et `users.get`. Chaque jalon ajoute ses handlers. Une route sans handler renvoie une erreur explicite « Route non simulée ».

## Contraintes globales

- Node ≥ 22.13 (machine de dev : 24.19), npm ≥ 11.
- Expo SDK 57, React Native 0.86, TypeScript `strict` + `noUncheckedIndexedAccess` partout.
- Identifiants conservés : bundle iOS `com.nach17.Lokky`, package Android `com.nach17.lokky`, `slug` EAS `Frontend`, `projectId` `7c688313-8128-4e0f-b8be-9766c1a6d9a5`, Apple Team `7UZ7GPX6A4`, scheme `lokky`, domaine `lokky.akylian.com` (`/activity/*`).
- Version de l'app : `2.0.0`, `runtimeVersion` = `appVersion`.
- Les composants n'utilisent que des tokens sémantiques, jamais de couleur hexadécimale en dur (exceptions : `LokkyLogo` et les tons d'`Avatar`, qui sont des couleurs de marque fixes).
- Contraste WCAG AA (≥ 4,5:1) pour tout texte, dans les deux thèmes. `brand` (`#FF6B3D`) n'est jamais une couleur de texte.
- Zones tactiles ≥ 44 pt. Taille de police système respectée, plafonnée à 1,3×.
- Textes de l'interface en français, tutoiement.
- Fichiers d'environ 250 lignes maximum. Les fichiers de `app/` ne contiennent pas de logique.
- Aucun commit (consigne de l'utilisateur).

## Points d'attention (Review Focus)

Cas que la spec implique sans qu'aucune tâche ne les teste naturellement. Chacun a un test dans la tâche indiquée.

1. **Téléphone réglé sur un autre fuseau** (expatrié resté à l'heure de Paris) : l'app doit afficher l'heure de Dakar. Test sous `TZ=Pacific/Kiritimati` (UTC+14) en tâche 5.
2. **Code email collé avec des espaces** (« 123 456 ») ou **email en majuscules avec espaces** : ils doivent être normalisés, pas refusés. Tâche 2.
3. **Message composé uniquement d'espaces** : il doit être refusé avant l'envoi. Tâche 2.
4. **Réseau lent ou requête qui ne répond jamais** (3G à Dakar) : erreur `timeout` au bout de 15 s, et relance automatique pour les erreurs réseau. Tâche 6.
5. **Build mal configuré** (mode `http` sans URL, ou mode inconnu) : l'app doit échouer immédiatement au démarrage avec un message clair, plutôt que d'appeler une URL vide. Tâche 5.

---

## Structure des fichiers créés

```
Lokky/
├─ package.json, .gitignore, .prettierrc, .prettierignore, .nvmrc
├─ .github/workflows/ci.yml
├─ packages/shared/
│  ├─ package.json, tsconfig.json
│  └─ src/
│     ├─ index.ts
│     ├─ constants.ts            catégories, statuts, quartiers + coordonnées, limites
│     ├─ time.ts                 heure de Dakar, plages « ce soir / ce week-end », statut d'activité, âge
│     ├─ geo.ts                  distance haversine
│     ├─ schemas/
│     │  ├─ common.ts            id, dates, coordonnées, pagination
│     │  ├─ user.ts              User, Me, onboarding, préférences
│     │  ├─ activity.ts          Activity, coût, lieu, création, filtres
│     │  ├─ chat.ts              Conversation, Message, envoi
│     │  ├─ safety.ts            avis, présence, signalement, blocage
│     │  ├─ auth.ts              email + code, OAuth, jetons
│     │  └─ errors.ts            codes d'erreur de l'API
│     ├─ api/
│     │  ├─ routes.ts            table des routes du contrat v1
│     │  └─ request.ts           construction chemin / query / body
│     ├─ realtime.ts             événements Socket.IO typés
│     └─ *.test.ts / schemas/*.test.ts / api/*.test.ts
└─ apps/mobile/
   ├─ app.config.ts, eas.json, babel.config.js, eslint.config.js, tsconfig.json
   ├─ jest.setup.ts, jest.global-setup.js, package.json
   ├─ assets/                    icon.png (provisoire), google-services.json, GoogleService-Info.plist
   ├─ app/
   │  ├─ _layout.tsx             fournisseurs (polices, thème, requêtes, toasts)
   │  ├─ index.tsx               → HomePlaceholderScreen
   │  └─ dev/ui.tsx              → DesignSystemScreen (dev uniquement)
   └─ src/
      ├─ lib/       env.ts, dates.ts, format.ts (+ tests)
      ├─ api/       types.ts, errors.ts, httpClient.ts, queryClient.ts, client.ts
      │             mock/ db.ts, seed.ts, serializers.ts, handlers.ts, mockClient.ts (+ tests)
      ├─ theme/     tokens.ts, themes.ts, contrast.ts, ThemeProvider.tsx, makeStyles.ts, fonts.ts, index.ts (+ tests)
      ├─ state/     preferences.ts
      ├─ ui/        Text, Button, IconButton, Input, TextArea, Chip, Badge, Avatar, AvatarStack,
      │             Card, Divider, Skeleton, EmptyState, ScreenHeader, Stepper, Sheet, Toast,
      │             LokkyLogo, index.ts (+ __tests__/)
      ├─ features/dev/screens/  HomePlaceholderScreen.tsx, DesignSystemScreen.tsx
      └─ test/render.tsx         rendu avec fournisseurs pour les tests
```

---

### Tâche 1 : socle du monorepo et règles de base du package `shared`

**Fichiers :**
- Créer : `package.json`, `.gitignore`, `.prettierrc`, `.prettierignore`, `.nvmrc`
- Créer : `packages/shared/package.json`, `packages/shared/tsconfig.json`
- Créer : `packages/shared/src/constants.ts`, `time.ts`, `geo.ts`, `index.ts`
- Tests : `packages/shared/src/time.test.ts`, `packages/shared/src/geo.test.ts`

**Interfaces produites :**
- `ACTIVITY_CATEGORIES`, `USER_STATUSES`, `ACTIVITY_STATUSES`, `CITIES`, `NEIGHBORHOOD_IDS`, `NEIGHBORHOODS`, `LIMITS`, `ACTIVITY_ONGOING_HOURS`, `CHAT_READONLY_AFTER_DAYS` et les types `ActivityCategory`, `UserStatus`, `ActivityStatus`, `City`, `NeighborhoodId`
- `startOfDakarDay(date: Date): Date`, `getWhenRange(when: When, now: Date): { from: Date; to: Date | null }`, `getActivityStatus(startsAt: Date, cancelledAt: Date | null, now: Date): ActivityStatus`, `ageInYears(birthDate: string, now: Date): number`, `isAdult(birthDate: string, now: Date): boolean`, type `When = 'tonight' | 'weekend' | 'all'`
- `haversineKm(a: LatLng, b: LatLng): number`, type `LatLng = { lat: number; lng: number }`

- [ ] **Étape 1 : créer les fichiers racine**

`package.json` :
```json
{
  "name": "lokky",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "lint": "npm run lint --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "prettier": "^3.9.9"
  },
  "engines": {
    "node": ">=22.13.0"
  }
}
```

`.gitignore` :
```
node_modules/
.expo/
dist/
web-build/
coverage/
ios/
android/
*.log
.env*.local
.DS_Store
```

`.prettierrc` :
```json
{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }
```

`.prettierignore` :
```
node_modules
package-lock.json
.expo
dist
coverage
docs
```

`.nvmrc` :
```
24
```

- [ ] **Étape 2 : créer le package `shared`**

`packages/shared/package.json` :
```json
{
  "name": "@lokky/shared",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "typescript": "~6.0.3",
    "vitest": "^5.0.3"
  }
}
```

`packages/shared/tsconfig.json` :
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": []
  },
  "include": ["src"]
}
```

Puis, à la racine : `npm install`. Attendu : installation sans erreur, création de `package-lock.json` à la racine.

- [ ] **Étape 3 : écrire `constants.ts`**

```ts
export const CITIES = ['dakar'] as const;
export type City = (typeof CITIES)[number];

export const ACTIVITY_CATEGORIES = [
  'sport',
  'beach',
  'cinema',
  'study',
  'music',
  'games',
  'food',
  'culture',
  'walk',
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const USER_STATUSES = ['student', 'newcomer', 'other'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ACTIVITY_STATUSES = ['upcoming', 'ongoing', 'past', 'cancelled'] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const NEIGHBORHOOD_IDS = [
  'plateau',
  'medina',
  'fann',
  'point-e',
  'mermoz',
  'sacre-coeur',
  'ouakam',
  'ngor',
  'yoff',
  'almadies',
  'liberte',
  'grand-yoff',
  'parcelles',
  'hlm',
  'hann',
  'pikine',
  'guediawaye',
] as const;
export type NeighborhoodId = (typeof NEIGHBORHOOD_IDS)[number];

// Coordonnées approximatives du centre de chaque quartier : repli quand la localisation est refusée.
export const NEIGHBORHOODS: Record<
  NeighborhoodId,
  { name: string; coordinates: { lat: number; lng: number } }
> = {
  plateau: { name: 'Plateau', coordinates: { lat: 14.668, lng: -17.433 } },
  medina: { name: 'Médina', coordinates: { lat: 14.683, lng: -17.45 } },
  fann: { name: 'Fann', coordinates: { lat: 14.693, lng: -17.463 } },
  'point-e': { name: 'Point E', coordinates: { lat: 14.695, lng: -17.456 } },
  mermoz: { name: 'Mermoz', coordinates: { lat: 14.708, lng: -17.475 } },
  'sacre-coeur': { name: 'Sacré-Cœur', coordinates: { lat: 14.72, lng: -17.468 } },
  ouakam: { name: 'Ouakam', coordinates: { lat: 14.724, lng: -17.488 } },
  ngor: { name: 'Ngor', coordinates: { lat: 14.747, lng: -17.513 } },
  yoff: { name: 'Yoff', coordinates: { lat: 14.756, lng: -17.471 } },
  almadies: { name: 'Almadies', coordinates: { lat: 14.741, lng: -17.52 } },
  liberte: { name: 'Liberté', coordinates: { lat: 14.718, lng: -17.456 } },
  'grand-yoff': { name: 'Grand Yoff', coordinates: { lat: 14.733, lng: -17.451 } },
  parcelles: { name: 'Parcelles Assainies', coordinates: { lat: 14.765, lng: -17.44 } },
  hlm: { name: 'HLM', coordinates: { lat: 14.711, lng: -17.44 } },
  hann: { name: 'Hann', coordinates: { lat: 14.723, lng: -17.428 } },
  pikine: { name: 'Pikine', coordinates: { lat: 14.755, lng: -17.39 } },
  guediawaye: { name: 'Guédiawaye', coordinates: { lat: 14.777, lng: -17.397 } },
};

export const LIMITS = {
  user: {
    firstNameMin: 2,
    firstNameMax: 30,
    interestsMin: 3,
    interestsMax: 9,
    minAge: 18,
    maxAge: 100,
  },
  activity: {
    titleMin: 3,
    titleMax: 60,
    descriptionMax: 500,
    placeNameMax: 80,
    meetingPointMax: 120,
    capacityMin: 2,
    capacityMax: 20,
    estimateFcfaMax: 100_000,
    participantsPreviewMax: 5,
    minLeadMinutes: 15,
    maxAheadDays: 60,
    defaultRadiusKm: 25,
    radiusKmMax: 50,
  },
  message: { bodyMax: 2000 },
  review: { commentMax: 300 },
  report: { detailsMin: 10, detailsMax: 500 },
  pagination: { defaultLimit: 20, maxLimit: 50 },
} as const;

export const ACTIVITY_ONGOING_HOURS = 3;
export const CHAT_READONLY_AFTER_DAYS = 7;
```

- [ ] **Étape 4 : écrire les tests de `time.ts` et `geo.ts` (ils doivent échouer)**

`packages/shared/src/time.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import { ageInYears, getActivityStatus, getWhenRange, isAdult, startOfDakarDay } from './time';

// 2026-10-07 est un mercredi.
const WED_10H = new Date('2026-10-07T10:00:00Z');

describe('startOfDakarDay', () => {
  it('ramène au début du jour en heure de Dakar (UTC+0)', () => {
    expect(startOfDakarDay(new Date('2026-10-07T23:30:00Z')).toISOString()).toBe(
      '2026-10-07T00:00:00.000Z',
    );
  });
});

describe('getWhenRange', () => {
  it('« ce soir » va de maintenant à la fin de la journée', () => {
    const r = getWhenRange('tonight', WED_10H);
    expect(r.from).toEqual(WED_10H);
    expect(r.to?.toISOString()).toBe('2026-10-07T23:59:59.999Z');
  });

  it('« ce week-end » un mercredi couvre samedi et dimanche', () => {
    const r = getWhenRange('weekend', WED_10H);
    expect(r.from.toISOString()).toBe('2026-10-10T00:00:00.000Z');
    expect(r.to?.toISOString()).toBe('2026-10-11T23:59:59.999Z');
  });

  it('« ce week-end » un samedi part de maintenant jusqu’à dimanche soir', () => {
    const sat = new Date('2026-10-10T15:00:00Z');
    const r = getWhenRange('weekend', sat);
    expect(r.from).toEqual(sat);
    expect(r.to?.toISOString()).toBe('2026-10-11T23:59:59.999Z');
  });

  it('« ce week-end » un dimanche se limite à la fin du dimanche', () => {
    const sun = new Date('2026-10-11T20:00:00Z');
    expect(getWhenRange('weekend', sun).to?.toISOString()).toBe('2026-10-11T23:59:59.999Z');
  });

  it('« tout » n’a pas de fin', () => {
    expect(getWhenRange('all', WED_10H)).toEqual({ from: WED_10H, to: null });
  });
});

describe('getActivityStatus', () => {
  const start = new Date('2026-10-07T18:00:00Z');
  const at = (iso: string) => new Date(iso);

  it('est à venir avant le début', () => {
    expect(getActivityStatus(start, null, at('2026-10-07T17:59:59Z'))).toBe('upcoming');
  });
  it('est en cours dès l’heure de début et pendant 3 h', () => {
    expect(getActivityStatus(start, null, start)).toBe('ongoing');
    expect(getActivityStatus(start, null, at('2026-10-07T20:59:59.999Z'))).toBe('ongoing');
  });
  it('est passée 3 h après le début', () => {
    expect(getActivityStatus(start, null, at('2026-10-07T21:00:00Z'))).toBe('past');
  });
  it('l’annulation l’emporte sur tout', () => {
    expect(getActivityStatus(start, at('2026-10-06T10:00:00Z'), at('2026-10-07T19:00:00Z'))).toBe(
      'cancelled',
    );
  });
});

describe('âge', () => {
  it('compte 18 ans le jour exact du 18e anniversaire', () => {
    expect(ageInYears('2008-10-07', WED_10H)).toBe(18);
    expect(isAdult('2008-10-07', WED_10H)).toBe(true);
  });
  it('refuse la veille du 18e anniversaire', () => {
    expect(ageInYears('2008-10-08', WED_10H)).toBe(17);
    expect(isAdult('2008-10-08', WED_10H)).toBe(false);
  });
  it('rejette une date mal formée', () => {
    expect(() => ageInYears('07/10/2008', WED_10H)).toThrow();
  });
});
```

`packages/shared/src/geo.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('vaut 0 pour un même point', () => {
    expect(haversineKm({ lat: 14.7, lng: -17.4 }, { lat: 14.7, lng: -17.4 })).toBe(0);
  });
  it('donne environ 10,6 km entre le Plateau et Yoff', () => {
    const d = haversineKm({ lat: 14.668, lng: -17.433 }, { lat: 14.756, lng: -17.471 });
    expect(d).toBeGreaterThan(10);
    expect(d).toBeLessThan(11.5);
  });
});
```

- [ ] **Étape 5 : lancer les tests**

Lancer : `npm run test --workspace @lokky/shared`
Attendu : ÉCHEC, modules `./time` et `./geo` introuvables.

- [ ] **Étape 6 : écrire `time.ts` et `geo.ts`**

`packages/shared/src/time.ts` :
```ts
import { ACTIVITY_ONGOING_HOURS, LIMITS, type ActivityStatus } from './constants';

// Africa/Dakar est à UTC+0 toute l'année (pas d'heure d'été) :
// tous les calculs de « jour » utilisent les accesseurs UTC.
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export type When = 'tonight' | 'weekend' | 'all';

export function startOfDakarDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const endOfDay = (dayStart: Date) => new Date(dayStart.getTime() + DAY_MS - 1);

export function getWhenRange(when: When, now: Date): { from: Date; to: Date | null } {
  if (when === 'all') return { from: now, to: null };
  const today = startOfDakarDay(now);
  if (when === 'tonight') return { from: now, to: endOfDay(today) };

  const weekday = now.getUTCDay(); // 0 = dimanche, 6 = samedi
  if (weekday === 6) return { from: now, to: endOfDay(new Date(today.getTime() + DAY_MS)) };
  if (weekday === 0) return { from: now, to: endOfDay(today) };
  const saturday = new Date(today.getTime() + (6 - weekday) * DAY_MS);
  return { from: saturday, to: endOfDay(new Date(saturday.getTime() + DAY_MS)) };
}

export function getActivityStatus(
  startsAt: Date,
  cancelledAt: Date | null,
  now: Date,
): ActivityStatus {
  if (cancelledAt) return 'cancelled';
  const start = startsAt.getTime();
  const t = now.getTime();
  if (t < start) return 'upcoming';
  if (t < start + ACTIVITY_ONGOING_HOURS * HOUR_MS) return 'ongoing';
  return 'past';
}

export function ageInYears(birthDate: string, now: Date): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) throw new Error(`Date de naissance invalide : ${birthDate}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const nowMonth = now.getUTCMonth() + 1;
  const beforeBirthday = nowMonth < month || (nowMonth === month && now.getUTCDate() < day);
  return now.getUTCFullYear() - year - (beforeBirthday ? 1 : 0);
}

export function isAdult(birthDate: string, now: Date): boolean {
  return ageInYears(birthDate, now) >= LIMITS.user.minAge;
}
```

`packages/shared/src/geo.ts` :
```ts
export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
```

`packages/shared/src/index.ts` (sera complété aux tâches 2 et 3) :
```ts
export * from './constants';
export * from './time';
export * from './geo';
```

- [ ] **Étape 7 : relancer les tests et le typecheck**

Lancer : `npm run test --workspace @lokky/shared` puis `npm run typecheck --workspace @lokky/shared`
Attendu : tous les tests PASSENT, typecheck sans erreur.

- [ ] **Point de contrôle (pas de commit)** : `git status` montre les nouveaux fichiers, rien n'est commité.

---

### Tâche 2 : schémas zod du contrat

**Fichiers :**
- Créer : `packages/shared/src/schemas/common.ts`, `user.ts`, `activity.ts`, `chat.ts`, `safety.ts`, `auth.ts`, `errors.ts`
- Modifier : `packages/shared/src/index.ts`
- Tests : `packages/shared/src/schemas/user.test.ts`, `activity.test.ts`, `chat.test.ts`, `auth.test.ts`, `safety.test.ts`

**Interfaces consommées :** `LIMITS`, `ACTIVITY_CATEGORIES`, `CITIES`, `NEIGHBORHOOD_IDS`, `USER_STATUSES`, `ACTIVITY_STATUSES`, `ageInYears` (tâche 1).

**Interfaces produites :**
- Schémas : `idSchema`, `isoDateTimeSchema`, `coordinatesSchema`, `citySchema`, `categorySchema`, `neighborhoodSchema`, `okSchema`, `emptyInputSchema`, `paginationQuerySchema`, `paginatedSchema(item)`, `trustStatsSchema`, `userPreviewSchema`, `userSchema`, `preferencesSchema`, `meSchema`, `makeOnboardingProfileSchema(now?)`, `onboardingProfileSchema`, `updateMeInputSchema`, `activityCostSchema`, `activityLocationSchema`, `activityViewerStateSchema`, `activitySchema`, `activityWhenSchema`, `activityListQuerySchema`, `myActivitiesQuerySchema`, `makeCreateActivityInputSchema(now?)`, `createActivityInputSchema`, `updateActivityInputSchema`, `messageSchema`, `conversationSchema`, `sendMessageInputSchema`, `messageListQuerySchema`, `reviewInputSchema`, `attendanceInputSchema`, `reportInputSchema`, `blockInputSchema`, `blockedUserSchema`, `emailStartInputSchema`, `emailVerifyInputSchema`, `oauthInputSchema`, `refreshInputSchema`, `authTokensSchema`, `authResultSchema`, `pushTokenInputSchema`, `avatarUploadInputSchema`, `avatarUploadOutputSchema`, `apiErrorCodeSchema`, `apiErrorBodySchema`, `API_ERROR_CODES`
- Types : `Coordinates`, `Paginated<T>`, `TrustStats`, `UserPreview`, `User`, `Me`, `Preferences`, `OnboardingProfile`, `UpdateMeInput`, `ActivityCost`, `ActivityLocation`, `Activity`, `ActivityListQuery`, `CreateActivityInput`, `Message`, `Conversation`, `SendMessageInput`, `ReviewInput`, `AttendanceInput`, `ReportInput`, `BlockedUser`, `AuthTokens`, `AuthResult`, `ApiErrorCode`, `ModerationStatus`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`packages/shared/src/schemas/user.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import { makeOnboardingProfileSchema } from './user';

const schema = makeOnboardingProfileSchema(() => new Date('2026-10-07T10:00:00Z'));
const valid = {
  firstName: '  Awa ',
  birthDate: '2004-03-12',
  status: 'student',
  neighborhood: 'fann',
  interests: ['beach', 'music', 'cinema'],
};

describe('profil d’onboarding', () => {
  it('accepte un profil valide et nettoie le prénom', () => {
    expect(schema.parse(valid).firstName).toBe('Awa');
  });
  it('accepte le jour exact des 18 ans', () => {
    expect(schema.safeParse({ ...valid, birthDate: '2008-10-07' }).success).toBe(true);
  });
  it('refuse la veille des 18 ans avec errors.age_min', () => {
    const r = schema.safeParse({ ...valid, birthDate: '2008-10-08' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('errors.age_min');
  });
  it('refuse moins de 3 centres d’intérêt', () => {
    expect(schema.safeParse({ ...valid, interests: ['beach', 'music'] }).success).toBe(false);
  });
  it('refuse les centres d’intérêt en double', () => {
    expect(schema.safeParse({ ...valid, interests: ['beach', 'beach', 'music'] }).success).toBe(
      false,
    );
  });
  it('refuse un quartier inconnu', () => {
    expect(schema.safeParse({ ...valid, neighborhood: 'paris' }).success).toBe(false);
  });
});
```

`packages/shared/src/schemas/activity.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import {
  activityCostSchema,
  activityListQuerySchema,
  activitySchema,
  makeCreateActivityInputSchema,
} from './activity';

const NOW = new Date('2026-10-07T10:00:00Z');
const inMinutes = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();
const create = makeCreateActivityInputSchema(() => NOW);

const location = {
  name: 'Plage de Yoff',
  coordinates: { lat: 14.758, lng: -17.473 },
  neighborhood: 'yoff',
  meetingPoint: null,
};
const validCreate = {
  title: 'Foot à la plage',
  category: 'sport',
  startsAt: inMinutes(120),
  location,
  capacity: 10,
  cost: { type: 'free' },
};

function makeActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    title: 'Foot à la plage',
    category: 'sport',
    description: '',
    startsAt: inMinutes(120),
    location,
    capacity: 10,
    cost: { type: 'free' },
    creator: {
      id: 'u1',
      firstName: 'Moussa',
      avatarUrl: null,
      trust: {
        activitiesAttended: 12,
        attendanceRate: 0.95,
        activitiesCreated: 9,
        creatorRating: 4.8,
        creatorReviewCount: 21,
      },
    },
    participantCount: 3,
    participantsPreview: [],
    firstTimerCount: 0,
    status: 'upcoming',
    city: 'dakar',
    distanceKm: null,
    viewerState: {
      isParticipant: false,
      isCreator: false,
      canJoin: true,
      canLeave: false,
      canReview: false,
    },
    createdAt: NOW.toISOString(),
    ...overrides,
  };
}

describe('coût', () => {
  it('accepte « gratuit » et retire les champs en trop', () => {
    expect(activityCostSchema.parse({ type: 'free', estimateFcfa: 3000 })).toEqual({ type: 'free' });
  });
  it('accepte « chacun paie sa part » avec ou sans estimation', () => {
    expect(activityCostSchema.safeParse({ type: 'split' }).success).toBe(true);
    expect(activityCostSchema.safeParse({ type: 'split', estimateFcfa: 3000 }).success).toBe(true);
  });
  it('refuse une estimation négative ou décimale', () => {
    expect(activityCostSchema.safeParse({ type: 'split', estimateFcfa: -5 }).success).toBe(false);
    expect(activityCostSchema.safeParse({ type: 'split', estimateFcfa: 2.5 }).success).toBe(false);
  });
});

describe('création d’activité', () => {
  it('accepte une activité valide et met la description à vide par défaut', () => {
    expect(create.parse(validCreate).description).toBe('');
  });
  it('refuse un début dans moins de 15 minutes', () => {
    expect(create.safeParse({ ...validCreate, startsAt: inMinutes(10) }).success).toBe(false);
  });
  it('refuse un début dans plus de 60 jours', () => {
    expect(create.safeParse({ ...validCreate, startsAt: inMinutes(61 * 24 * 60) }).success).toBe(
      false,
    );
  });
  it('refuse une capacité hors de 2 à 20', () => {
    expect(create.safeParse({ ...validCreate, capacity: 1 }).success).toBe(false);
    expect(create.safeParse({ ...validCreate, capacity: 21 }).success).toBe(false);
  });
});

describe('activité', () => {
  it('accepte une activité complète valide', () => {
    expect(activitySchema.safeParse(makeActivity()).success).toBe(true);
  });
  it('refuse plus de participants que de places', () => {
    expect(activitySchema.safeParse(makeActivity({ participantCount: 11 })).success).toBe(false);
  });
});

describe('filtres de liste', () => {
  it('exige lat et lng ensemble', () => {
    expect(activityListQuerySchema.safeParse({ lat: 14.7 }).success).toBe(false);
    expect(activityListQuerySchema.safeParse({ lat: 14.7, lng: -17.4 }).success).toBe(true);
  });
});
```

`packages/shared/src/schemas/chat.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import { conversationSchema, sendMessageInputSchema } from './chat';

const base = { conversationId: 'c1', clientId: 'client-123456' };

describe('envoi de message', () => {
  it('nettoie les espaces autour du message', () => {
    expect(sendMessageInputSchema.parse({ ...base, body: '  Salut !  ' }).body).toBe('Salut !');
  });
  it('refuse un message composé uniquement d’espaces', () => {
    expect(sendMessageInputSchema.safeParse({ ...base, body: '   \n  ' }).success).toBe(false);
  });
  it('refuse un message de plus de 2000 caractères', () => {
    expect(sendMessageInputSchema.safeParse({ ...base, body: 'a'.repeat(2001) }).success).toBe(
      false,
    );
  });
});

describe('conversation', () => {
  const conv = {
    id: 'c1',
    type: 'group',
    activityId: 'a1',
    title: 'Foot à la plage',
    avatarUrl: null,
    lastMessage: null,
    unreadCount: 0,
    isReadOnly: false,
    updatedAt: '2026-10-07T10:00:00Z',
  };
  it('accepte une conversation de groupe liée à une activité', () => {
    expect(conversationSchema.safeParse(conv).success).toBe(true);
  });
  it('refuse un groupe sans activité', () => {
    expect(conversationSchema.safeParse({ ...conv, activityId: null }).success).toBe(false);
  });
  it('refuse une conversation privée liée à une activité', () => {
    expect(conversationSchema.safeParse({ ...conv, type: 'direct' }).success).toBe(false);
  });
});
```

`packages/shared/src/schemas/auth.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import { emailStartInputSchema, emailVerifyInputSchema } from './auth';

describe('connexion par email', () => {
  it('normalise l’email (espaces, majuscules)', () => {
    expect(emailStartInputSchema.parse({ email: '  Awa@Gmail.COM ' }).email).toBe('awa@gmail.com');
  });
  it('refuse un email invalide', () => {
    expect(emailStartInputSchema.safeParse({ email: 'awa@' }).success).toBe(false);
  });
  it('accepte un code collé avec des espaces', () => {
    const r = emailVerifyInputSchema.parse({ email: 'awa@gmail.com', code: ' 123 456 ' });
    expect(r.code).toBe('123456');
  });
  it('refuse un code qui n’a pas 6 chiffres', () => {
    expect(emailVerifyInputSchema.safeParse({ email: 'a@b.sn', code: '12345' }).success).toBe(false);
    expect(emailVerifyInputSchema.safeParse({ email: 'a@b.sn', code: 'abcdef' }).success).toBe(
      false,
    );
  });
});
```

`packages/shared/src/schemas/safety.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import { reportInputSchema, reviewInputSchema } from './safety';

describe('signalement', () => {
  const base = { targetType: 'user', targetId: 'u1' };
  it('accepte un motif précis sans détails', () => {
    expect(reportInputSchema.safeParse({ ...base, reason: 'harassment' }).success).toBe(true);
  });
  it('exige au moins 10 caractères de détails pour « autre »', () => {
    expect(reportInputSchema.safeParse({ ...base, reason: 'other', details: 'bof' }).success).toBe(
      false,
    );
    expect(
      reportInputSchema.safeParse({ ...base, reason: 'other', details: 'Comportement bizarre' })
        .success,
    ).toBe(true);
  });
});

describe('avis', () => {
  it('refuse une note hors de 1 à 5', () => {
    expect(reviewInputSchema.safeParse({ activityId: 'a1', creatorRating: 0 }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ activityId: 'a1', creatorRating: 6 }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ activityId: 'a1', creatorRating: 5 }).success).toBe(true);
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm run test --workspace @lokky/shared`
Attendu : ÉCHEC, modules `./user`, `./activity`, `./chat`, `./auth`, `./safety` introuvables.

- [ ] **Étape 3 : écrire les schémas**

`packages/shared/src/schemas/common.ts` :
```ts
import { z } from 'zod';
import { ACTIVITY_CATEGORIES, CITIES, LIMITS, NEIGHBORHOOD_IDS } from '../constants';

export const idSchema = z.string().min(1);
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const citySchema = z.enum(CITIES);
export const categorySchema = z.enum(ACTIVITY_CATEGORIES);
export const neighborhoodSchema = z.enum(NEIGHBORHOOD_IDS);
export const okSchema = z.object({ ok: z.literal(true) });
export const emptyInputSchema = z.object({});

export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(LIMITS.pagination.maxLimit).optional(),
});

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Paginated<T> = { items: T[]; nextCursor: string | null };
```

`packages/shared/src/schemas/user.ts` :
```ts
import { z } from 'zod';
import { LIMITS, USER_STATUSES } from '../constants';
import { ageInYears } from '../time';
import { categorySchema, idSchema, isoDateTimeSchema, neighborhoodSchema } from './common';

export const userStatusSchema = z.enum(USER_STATUSES);
export const moderationStatusSchema = z.enum(['active', 'warned', 'suspended', 'banned']);

export const trustStatsSchema = z.object({
  activitiesAttended: z.number().int().nonnegative(),
  // null tant qu'il n'y a pas d'historique : l'interface affiche « Nouveau », pas « 0 % ».
  attendanceRate: z.number().min(0).max(1).nullable(),
  activitiesCreated: z.number().int().nonnegative(),
  creatorRating: z.number().min(1).max(5).nullable(),
  creatorReviewCount: z.number().int().nonnegative(),
});

export const userPreviewSchema = z.object({
  id: idSchema,
  firstName: z.string().min(1),
  avatarUrl: z.url().nullable(),
});

export const userSchema = userPreviewSchema.extend({
  status: userStatusSchema,
  neighborhood: neighborhoodSchema,
  interests: z.array(categorySchema),
  trust: trustStatsSchema,
});

export const preferencesSchema = z.object({
  language: z.enum(['fr', 'en']),
  theme: z.enum(['system', 'light', 'dark']),
  notifications: z.object({
    messages: z.boolean(),
    activityUpdates: z.boolean(),
    reminders: z.boolean(),
  }),
});

export const meSchema = userSchema.extend({
  email: z.email(),
  birthDate: z.iso.date(),
  preferences: preferencesSchema,
  moderation: z.object({
    status: moderationStatusSchema,
    suspendedUntil: isoDateTimeSchema.nullable(),
  }),
});

const firstNameSchema = z
  .string()
  .trim()
  .min(LIMITS.user.firstNameMin)
  .max(LIMITS.user.firstNameMax);

const interestsSchema = z
  .array(categorySchema)
  .min(LIMITS.user.interestsMin)
  .max(LIMITS.user.interestsMax)
  .refine((list) => new Set(list).size === list.length, { message: 'errors.duplicate_interests' });

export function makeOnboardingProfileSchema(now: () => Date = () => new Date()) {
  return z.object({
    firstName: firstNameSchema,
    birthDate: z.iso
      .date()
      .refine((d) => ageInYears(d, now()) >= LIMITS.user.minAge, { message: 'errors.age_min' })
      .refine((d) => ageInYears(d, now()) <= LIMITS.user.maxAge, { message: 'errors.age_max' }),
    status: userStatusSchema,
    neighborhood: neighborhoodSchema,
    interests: interestsSchema,
  });
}
export const onboardingProfileSchema = makeOnboardingProfileSchema();

export const updateMeInputSchema = z
  .object({
    firstName: firstNameSchema,
    status: userStatusSchema,
    neighborhood: neighborhoodSchema,
    interests: interestsSchema,
    avatarUrl: z.url().nullable(),
    preferences: preferencesSchema,
  })
  .partial();

export type ModerationStatus = z.infer<typeof moderationStatusSchema>;
export type TrustStats = z.infer<typeof trustStatsSchema>;
export type UserPreview = z.infer<typeof userPreviewSchema>;
export type User = z.infer<typeof userSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type Me = z.infer<typeof meSchema>;
export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;
export type UpdateMeInput = z.infer<typeof updateMeInputSchema>;
```

`packages/shared/src/schemas/activity.ts` :
```ts
import { z } from 'zod';
import { ACTIVITY_STATUSES, LIMITS } from '../constants';
import {
  categorySchema,
  citySchema,
  coordinatesSchema,
  idSchema,
  isoDateTimeSchema,
  neighborhoodSchema,
  paginationQuerySchema,
} from './common';
import { trustStatsSchema, userPreviewSchema } from './user';

const L = LIMITS.activity;

export const activityStatusSchema = z.enum(ACTIVITY_STATUSES);

export const activityCostSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('free') }),
  z.object({
    type: z.literal('split'),
    estimateFcfa: z.number().int().positive().max(L.estimateFcfaMax).optional(),
  }),
]);

export const activityLocationSchema = z.object({
  name: z.string().trim().min(2).max(L.placeNameMax),
  coordinates: coordinatesSchema,
  neighborhood: neighborhoodSchema.nullable(),
  meetingPoint: z.string().trim().max(L.meetingPointMax).nullable(),
});

export const activityViewerStateSchema = z.object({
  isParticipant: z.boolean(),
  isCreator: z.boolean(),
  canJoin: z.boolean(),
  canLeave: z.boolean(),
  canReview: z.boolean(),
});

const titleSchema = z.string().trim().min(L.titleMin).max(L.titleMax);
const descriptionSchema = z.string().trim().max(L.descriptionMax);
const capacitySchema = z.number().int().min(L.capacityMin).max(L.capacityMax);

export const activitySchema = z
  .object({
    id: idSchema,
    title: titleSchema,
    category: categorySchema,
    description: descriptionSchema,
    startsAt: isoDateTimeSchema,
    location: activityLocationSchema,
    capacity: capacitySchema,
    cost: activityCostSchema,
    creator: userPreviewSchema.extend({ trust: trustStatsSchema }),
    participantCount: z.number().int().min(1),
    participantsPreview: z.array(userPreviewSchema).max(L.participantsPreviewMax),
    firstTimerCount: z.number().int().nonnegative(),
    status: activityStatusSchema,
    city: citySchema,
    distanceKm: z.number().nonnegative().nullable(),
    viewerState: activityViewerStateSchema,
    createdAt: isoDateTimeSchema,
  })
  .refine((a) => a.participantCount <= a.capacity, {
    message: 'errors.participants_over_capacity',
    path: ['participantCount'],
  });

export const activityWhenSchema = z.enum(['tonight', 'weekend', 'all']);

export const activityListQuerySchema = paginationQuerySchema
  .extend({
    when: activityWhenSchema.optional(),
    categories: z.array(categorySchema).optional(),
    freeOnly: z.boolean().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    radiusKm: z.number().min(1).max(L.radiusKmMax).optional(),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: 'errors.lat_lng_together',
  });

export const myActivitiesQuerySchema = paginationQuerySchema.extend({
  scope: z.enum(['upcoming', 'past', 'created']),
});

export function makeCreateActivityInputSchema(now: () => Date = () => new Date()) {
  return z.object({
    title: titleSchema,
    category: categorySchema,
    description: descriptionSchema.default(''),
    startsAt: isoDateTimeSchema.refine(
      (value) => {
        const t = new Date(value).getTime();
        const n = now().getTime();
        return t >= n + L.minLeadMinutes * 60_000 && t <= n + L.maxAheadDays * 86_400_000;
      },
      { message: 'errors.starts_at_range' },
    ),
    location: activityLocationSchema,
    capacity: capacitySchema,
    cost: activityCostSchema,
  });
}
export const createActivityInputSchema = makeCreateActivityInputSchema();

export const updateActivityInputSchema = z.object({
  id: idSchema,
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  startsAt: isoDateTimeSchema.optional(),
  location: activityLocationSchema.optional(),
  capacity: capacitySchema.optional(),
  cost: activityCostSchema.optional(),
});

export type ActivityCost = z.infer<typeof activityCostSchema>;
export type ActivityLocation = z.infer<typeof activityLocationSchema>;
export type ActivityViewerState = z.infer<typeof activityViewerStateSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type ActivityListQuery = z.input<typeof activityListQuerySchema>;
export type CreateActivityInput = z.input<typeof createActivityInputSchema>;
```

`packages/shared/src/schemas/chat.ts` :
```ts
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
    title: z.string().min(1),
    avatarUrl: z.url().nullable(),
    lastMessage: messageSchema.nullable(),
    unreadCount: z.number().int().nonnegative(),
    isReadOnly: z.boolean(),
    updatedAt: isoDateTimeSchema,
  })
  .refine((c) => (c.type === 'group') === (c.activityId !== null), {
    message: 'errors.group_requires_activity',
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
```

`packages/shared/src/schemas/safety.ts` :
```ts
import { z } from 'zod';
import { LIMITS } from '../constants';
import { idSchema, isoDateTimeSchema } from './common';
import { userPreviewSchema } from './user';

export const reviewInputSchema = z.object({
  activityId: idSchema,
  creatorRating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(LIMITS.review.commentMax).optional(),
});

export const attendanceInputSchema = z.object({
  activityId: idSchema,
  attendance: z.array(z.object({ userId: idSchema, attended: z.boolean() })).min(1),
});

export const reportReasonSchema = z.enum([
  'harassment',
  'inappropriate',
  'fake',
  'dangerous',
  'spam',
  'other',
]);

export const reportInputSchema = z
  .object({
    targetType: z.enum(['user', 'activity', 'message']),
    targetId: idSchema,
    reason: reportReasonSchema,
    details: z.string().trim().max(LIMITS.report.detailsMax).optional(),
  })
  .refine((r) => r.reason !== 'other' || (r.details?.length ?? 0) >= LIMITS.report.detailsMin, {
    message: 'errors.report_details_required',
    path: ['details'],
  });

export const blockInputSchema = z.object({ userId: idSchema });
export const blockedUserSchema = userPreviewSchema.extend({ blockedAt: isoDateTimeSchema });

export type ReviewInput = z.input<typeof reviewInputSchema>;
export type AttendanceInput = z.input<typeof attendanceInputSchema>;
export type ReportInput = z.input<typeof reportInputSchema>;
export type BlockedUser = z.infer<typeof blockedUserSchema>;
```

`packages/shared/src/schemas/auth.ts` :
```ts
import { z } from 'zod';
import { meSchema } from './user';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const emailStartInputSchema = z.object({ email: emailSchema });

export const emailVerifyInputSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .transform((s) => s.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'errors.code_format')),
});

export const oauthInputSchema = z.object({
  provider: z.enum(['apple', 'google']),
  idToken: z.string().min(1),
  firstName: z.string().trim().min(1).max(30).optional(), // Apple ne le transmet qu'à la 1re connexion
});

export const refreshInputSchema = z.object({ refreshToken: z.string().min(1) });

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(), // secondes
});

// user = null : compte créé mais onboarding pas encore fait.
export const authResultSchema = z.object({ tokens: authTokensSchema, user: meSchema.nullable() });

export const pushTokenInputSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

export const avatarUploadInputSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
export const avatarUploadOutputSchema = z.object({
  uploadUrl: z.url(),
  method: z.literal('PUT'),
  headers: z.record(z.string(), z.string()),
  publicUrl: z.url(),
});

export type AuthTokens = z.infer<typeof authTokensSchema>;
export type AuthResult = z.infer<typeof authResultSchema>;
```

`packages/shared/src/schemas/errors.ts` :
```ts
import { z } from 'zod';

export const API_ERROR_CODES = [
  'unauthorized',
  'forbidden',
  'not_found',
  'validation',
  'conflict',
  'activity_full',
  'activity_started',
  'not_participant',
  'rate_limited',
  'account_suspended',
  'account_banned',
  'internal',
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export const apiErrorBodySchema = z.object({
  error: z.object({ code: apiErrorCodeSchema, message: z.string() }),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
```

`packages/shared/src/index.ts` (remplace le contenu) :
```ts
export * from './constants';
export * from './time';
export * from './geo';
export * from './schemas/common';
export * from './schemas/user';
export * from './schemas/activity';
export * from './schemas/chat';
export * from './schemas/safety';
export * from './schemas/auth';
export * from './schemas/errors';
```

- [ ] **Étape 4 : relancer tests et typecheck**

Lancer : `npm run test --workspace @lokky/shared` puis `npm run typecheck --workspace @lokky/shared`
Attendu : tout PASSE. Si `z.iso.datetime` ou `z.email` n'existent pas, vérifier que `zod` installé est bien en 4.x (`npm ls zod`).

- [ ] **Point de contrôle (pas de commit).**

---

### Tâche 3 : table des routes, construction des requêtes, événements temps réel

**Fichiers :**
- Créer : `packages/shared/src/api/routes.ts`, `packages/shared/src/api/request.ts`, `packages/shared/src/realtime.ts`
- Modifier : `packages/shared/src/index.ts`
- Tests : `packages/shared/src/api/routes.test.ts`, `packages/shared/src/api/request.test.ts`

**Interfaces consommées :** tous les schémas de la tâche 2.

**Interfaces produites :**
- `routes` (objet constant), types `HttpMethod`, `RouteDef`, `Routes`, `RouteName`, `RouteInput<R>`, `RouteParsedInput<R>`, `RouteOutput<R>`
- `pathParams(path: string): string[]`, `buildRequest(def: { method: HttpMethod; path: string }, input: Record<string, unknown>): BuiltRequest`, `toQueryString(query: Record<string, QueryValue>): string`, types `BuiltRequest`, `QueryValue`
- Types `ServerToClientEvents`, `ClientToServerEvents`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`packages/shared/src/api/request.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import { buildRequest, pathParams, toQueryString } from './request';

describe('pathParams', () => {
  it('liste les paramètres du chemin', () => {
    expect(pathParams('/conversations/:conversationId/messages')).toEqual(['conversationId']);
    expect(pathParams('/activities')).toEqual([]);
  });
});

describe('buildRequest', () => {
  it('remplace et encode les paramètres de chemin', () => {
    const r = buildRequest({ method: 'GET', path: '/users/:id' }, { id: 'u 1/2' });
    expect(r).toEqual({ method: 'GET', path: '/users/u%201%2F2', query: null, body: null });
  });
  it('envoie le reste en query pour un GET, sans les valeurs undefined', () => {
    const r = buildRequest(
      { method: 'GET', path: '/activities' },
      { when: 'tonight', categories: ['sport', 'beach'], freeOnly: true, cursor: undefined },
    );
    expect(r.query).toEqual({ when: 'tonight', categories: ['sport', 'beach'], freeOnly: true });
    expect(r.body).toBeNull();
  });
  it('envoie le reste en body pour un POST', () => {
    const r = buildRequest(
      { method: 'POST', path: '/conversations/:conversationId/messages' },
      { conversationId: 'c1', clientId: 'abc12345', body: 'Salut' },
    );
    expect(r.path).toBe('/conversations/c1/messages');
    expect(r.body).toEqual({ clientId: 'abc12345', body: 'Salut' });
    expect(r.query).toBeNull();
  });
  it('échoue si un paramètre de chemin manque', () => {
    expect(() => buildRequest({ method: 'GET', path: '/users/:id' }, {})).toThrow(/id/);
  });
  it('échoue sur un objet imbriqué en query', () => {
    expect(() =>
      buildRequest({ method: 'GET', path: '/activities' }, { near: { lat: 1, lng: 2 } }),
    ).toThrow(/near/);
  });
});

describe('toQueryString', () => {
  it('répète les clés de tableau et encode les valeurs', () => {
    expect(toQueryString({ categories: ['sport', 'beach'], q: 'thé & jeux', limit: 20 })).toBe(
      'categories=sport&categories=beach&q=th%C3%A9%20%26%20jeux&limit=20',
    );
  });
});
```

`packages/shared/src/api/routes.test.ts` :
```ts
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { pathParams } from './request';
import { routes } from './routes';

describe('table des routes', () => {
  it('chaque paramètre de chemin existe dans le schéma d’entrée', () => {
    for (const [name, def] of Object.entries(routes)) {
      expect(def.input, name).toBeInstanceOf(z.ZodObject);
      const keys = Object.keys((def.input as z.ZodObject).shape);
      for (const param of pathParams(def.path)) {
        expect(keys, `${name} : paramètre « ${param} »`).toContain(param);
      }
    }
  });

  it('aucune paire méthode + chemin n’est déclarée deux fois', () => {
    const seen = Object.values(routes).map((d) => `${d.method} ${d.path}`);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('seules les routes de connexion sont publiques', () => {
    const publicRoutes = Object.entries(routes)
      .filter(([, d]) => !d.auth)
      .map(([n]) => n)
      .sort();
    expect(publicRoutes).toEqual(['auth.emailStart', 'auth.emailVerify', 'auth.oauth', 'auth.refresh']);
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm run test --workspace @lokky/shared`
Attendu : ÉCHEC, modules `./request` et `./routes` introuvables.

- [ ] **Étape 3 : écrire `request.ts`, `routes.ts`, `realtime.ts`**

`packages/shared/src/api/request.ts` :
```ts
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Scalar = string | number | boolean;
export type QueryValue = Scalar | Scalar[];

export interface BuiltRequest {
  method: HttpMethod;
  path: string;
  query: Record<string, QueryValue> | null;
  body: Record<string, unknown> | null;
}

const PARAM = /:([A-Za-z]\w*)/g;

export function pathParams(path: string): string[] {
  return [...path.matchAll(PARAM)].map((m) => m[1] ?? '');
}

const isScalar = (v: unknown): v is Scalar =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const isQueryValue = (v: unknown): v is QueryValue =>
  isScalar(v) || (Array.isArray(v) && v.every(isScalar));

export function buildRequest(
  def: { method: HttpMethod; path: string },
  input: Record<string, unknown>,
): BuiltRequest {
  const rest: Record<string, unknown> = { ...input };
  const path = def.path.replace(PARAM, (_match, name: string) => {
    const value = rest[name];
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Paramètre de chemin manquant : ${name}`);
    }
    delete rest[name];
    return encodeURIComponent(value);
  });

  const entries = Object.entries(rest).filter(([, v]) => v !== undefined);
  if (def.method === 'GET' || def.method === 'DELETE') {
    if (entries.length === 0) return { method: def.method, path, query: null, body: null };
    const query: Record<string, QueryValue> = {};
    for (const [key, value] of entries) {
      if (!isQueryValue(value)) throw new Error(`Valeur de requête non sérialisable : ${key}`);
      query[key] = value;
    }
    return { method: def.method, path, query, body: null };
  }
  return { method: def.method, path, query: null, body: Object.fromEntries(entries) };
}

// Écrit à la main : URLSearchParams est incomplet dans React Native.
export function toQueryString(query: Record<string, QueryValue>): string {
  const pair = (k: string, v: Scalar) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
  return Object.entries(query)
    .flatMap(([k, v]) => (Array.isArray(v) ? v.map((item) => pair(k, item)) : [pair(k, v)]))
    .join('&');
}
```

`packages/shared/src/api/routes.ts` :
```ts
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
import { meSchema, onboardingProfileSchema, updateMeInputSchema, userSchema } from '../schemas/user';
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
  'auth.emailStart': route({ method: 'POST', path: '/auth/email/start', auth: false, input: emailStartInputSchema, output: okSchema }),
  'auth.emailVerify': route({ method: 'POST', path: '/auth/email/verify', auth: false, input: emailVerifyInputSchema, output: authResultSchema }),
  'auth.oauth': route({ method: 'POST', path: '/auth/oauth', auth: false, input: oauthInputSchema, output: authResultSchema }),
  'auth.refresh': route({ method: 'POST', path: '/auth/refresh', auth: false, input: refreshInputSchema, output: authTokensSchema }),
  'auth.logout': route({ method: 'POST', path: '/auth/logout', auth: true, input: refreshInputSchema, output: okSchema }),

  // Moi
  'me.get': route({ method: 'GET', path: '/me', auth: true, input: emptyInputSchema, output: meSchema }),
  'me.completeOnboarding': route({ method: 'POST', path: '/me/onboarding', auth: true, input: onboardingProfileSchema, output: meSchema }),
  'me.update': route({ method: 'PATCH', path: '/me', auth: true, input: updateMeInputSchema, output: meSchema }),
  'me.delete': route({ method: 'DELETE', path: '/me', auth: true, input: emptyInputSchema, output: okSchema }),
  'me.registerPushToken': route({ method: 'POST', path: '/me/push-token', auth: true, input: pushTokenInputSchema, output: okSchema }),
  'me.avatarUploadUrl': route({ method: 'POST', path: '/me/avatar/upload-url', auth: true, input: avatarUploadInputSchema, output: avatarUploadOutputSchema }),

  // Activités
  'activities.list': route({ method: 'GET', path: '/activities', auth: true, input: activityListQuerySchema, output: paginatedSchema(activitySchema) }),
  'activities.mine': route({ method: 'GET', path: '/me/activities', auth: true, input: myActivitiesQuerySchema, output: paginatedSchema(activitySchema) }),
  'activities.get': route({ method: 'GET', path: '/activities/:id', auth: true, input: byId, output: activitySchema }),
  'activities.participants': route({ method: 'GET', path: '/activities/:id/participants', auth: true, input: byId, output: z.array(userSchema) }),
  'activities.create': route({ method: 'POST', path: '/activities', auth: true, input: createActivityInputSchema, output: activitySchema }),
  'activities.update': route({ method: 'PATCH', path: '/activities/:id', auth: true, input: updateActivityInputSchema, output: activitySchema }),
  'activities.cancel': route({ method: 'POST', path: '/activities/:id/cancel', auth: true, input: byId, output: activitySchema }),
  'activities.join': route({ method: 'POST', path: '/activities/:id/join', auth: true, input: byId, output: activitySchema }),
  'activities.leave': route({ method: 'POST', path: '/activities/:id/leave', auth: true, input: byId, output: activitySchema }),
  'activities.attendance': route({ method: 'POST', path: '/activities/:activityId/attendance', auth: true, input: attendanceInputSchema, output: okSchema }),
  'reviews.create': route({ method: 'POST', path: '/activities/:activityId/reviews', auth: true, input: reviewInputSchema, output: okSchema }),

  // Utilisateurs
  'users.get': route({ method: 'GET', path: '/users/:id', auth: true, input: byId, output: userSchema }),

  // Messagerie
  'conversations.list': route({ method: 'GET', path: '/conversations', auth: true, input: paginationQuerySchema, output: paginatedSchema(conversationSchema) }),
  'conversations.get': route({ method: 'GET', path: '/conversations/:id', auth: true, input: byId, output: conversationSchema }),
  'conversations.openDirect': route({ method: 'POST', path: '/conversations/direct', auth: true, input: z.object({ userId: idSchema }), output: conversationSchema }),
  'conversations.markRead': route({ method: 'POST', path: '/conversations/:id/read', auth: true, input: byId, output: okSchema }),
  'messages.list': route({ method: 'GET', path: '/conversations/:conversationId/messages', auth: true, input: messageListQuerySchema, output: paginatedSchema(messageSchema) }),
  'messages.send': route({ method: 'POST', path: '/conversations/:conversationId/messages', auth: true, input: sendMessageInputSchema, output: messageSchema }),

  // Sécurité
  'reports.create': route({ method: 'POST', path: '/reports', auth: true, input: reportInputSchema, output: okSchema }),
  'blocks.list': route({ method: 'GET', path: '/me/blocks', auth: true, input: emptyInputSchema, output: z.array(blockedUserSchema) }),
  'blocks.create': route({ method: 'POST', path: '/me/blocks', auth: true, input: blockInputSchema, output: okSchema }),
  'blocks.delete': route({ method: 'DELETE', path: '/me/blocks/:userId', auth: true, input: blockInputSchema, output: okSchema }),
} as const;

export type Routes = typeof routes;
export type RouteName = keyof Routes;
export type RouteInput<R extends RouteName> = z.input<Routes[R]['input']>;
export type RouteParsedInput<R extends RouteName> = z.output<Routes[R]['input']>;
export type RouteOutput<R extends RouteName> = z.output<Routes[R]['output']>;
```

> Prettier reformatera chaque `route({ ... })` sur plusieurs lignes : c'est normal.

`packages/shared/src/realtime.ts` :
```ts
import type { Activity } from './schemas/activity';
import type { Message } from './schemas/chat';
import type { ModerationStatus, UserPreview } from './schemas/user';

// Les messages s'envoient par HTTP (messages.send) ; le socket ne sert qu'à recevoir.
export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  typing: (payload: { conversationId: string; user: UserPreview; isTyping: boolean }) => void;
  'conversation:read': (payload: { conversationId: string; userId: string; readAt: string }) => void;
  'unread:update': (payload: { total: number }) => void;
  'activity:updated': (activity: Activity) => void;
  'activity:cancelled': (payload: { activityId: string }) => void;
  'moderation:update': (payload: { status: ModerationStatus; suspendedUntil: string | null }) => void;
}

export interface ClientToServerEvents {
  'conversation:join': (payload: { conversationId: string }) => void;
  'conversation:leave': (payload: { conversationId: string }) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
}
```

Ajouter à la fin de `packages/shared/src/index.ts` :
```ts
export * from './api/request';
export * from './api/routes';
export * from './realtime';
```

- [ ] **Étape 4 : relancer tests, typecheck, formatage**

Lancer : `npm run test --workspace @lokky/shared`, `npm run typecheck --workspace @lokky/shared`, puis `npm run format` et `npm run format:check` à la racine.
Attendu : tout PASSE.

- [ ] **Point de contrôle (pas de commit).**

---
### Tâche 4 : app Expo neuve dans le monorepo, avec l'outillage

**Fichiers :**
- Créer (via le générateur, puis nettoyer) : `apps/mobile/`
- Créer : `apps/mobile/app.config.ts`, `eas.json`, `babel.config.js`, `eslint.config.js`, `tsconfig.json`, `jest.setup.ts`, `jest.global-setup.js`
- Créer : `apps/mobile/app/_layout.tsx` et `app/index.tsx` (versions minimales, remplacées à la tâche 12)
- Copier depuis l'ancien projet : `assets/icon.png`, `google-services.json`, `GoogleService-Info.plist`
- Test : `apps/mobile/src/__tests__/smoke.test.tsx`

**Interfaces produites :** alias d'import `@/*` → `apps/mobile/src/*` ; scripts `lint`, `typecheck`, `test` dans `@lokky/mobile` ; règle ESLint de sens des dépendances.

- [ ] **Étape 1 : générer l'app**

```bash
cd C:/Users/user/Desktop/Styve/Lokky/apps
npx create-expo-app@latest mobile --template blank-typescript --no-install
```

Puis dans `apps/mobile/` : supprimer `App.tsx`, `index.ts`, `app.json` et, s'ils existent, `node_modules/`, `package-lock.json` et `.git/`.

- [ ] **Étape 2 : adapter `apps/mobile/package.json`**

Garder les `dependencies` générées (`expo`, `react`, `react-native`, `expo-status-bar`…) et remplacer le reste par :
```json
{
  "name": "@lokky/mobile",
  "version": "2.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo",
    "globalSetup": "<rootDir>/jest.global-setup.js",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
    "moduleNameMapper": { "^@/(.*)$": "<rootDir>/src/$1" },
    "testPathIgnorePatterns": ["/node_modules/", "/.expo/"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|phosphor-react-native|@shopify/flash-list)"
    ]
  }
}
```
Ajouter `"@lokky/shared": "*"` dans `dependencies`.

- [ ] **Étape 3 : installer les dépendances**

```bash
cd C:/Users/user/Desktop/Styve/Lokky
npm install
cd apps/mobile
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-splash-screen expo-system-ui expo-font expo-dev-client expo-image react-native-safe-area-context react-native-screens react-native-reanimated react-native-worklets react-native-svg @expo-google-fonts/fredoka @expo-google-fonts/inter
npm install @tanstack/react-query zustand phosphor-react-native
npx expo install jest-expo jest @types/jest @testing-library/react-native test-renderer @react-native/jest-preset eslint eslint-config-expo -- --save-dev
npm install --save-dev eslint-import-resolver-typescript
```
Attendu : aucune erreur. `npm ls expo` affiche une version `57.x`. Un seul `node_modules` à la racine du monorepo.

- [ ] **Étape 4 : configuration Expo, EAS et assets**

Copier depuis `C:/Users/user/Desktop/Styve/ProjetLokky/Frontend/` :
- `assets/images/icon.png` → `apps/mobile/assets/icon.png` (provisoire)
- `google-services.json` → `apps/mobile/google-services.json`
- `GoogleService-Info.plist` → `apps/mobile/GoogleService-Info.plist`

`apps/mobile/app.config.ts` :
```ts
import type { ExpoConfig } from 'expo/config';

const LOCATION_TEXT =
  'Lokky utilise ta position pendant que tu utilises l’app pour te proposer des sorties près de toi.';

const config: ExpoConfig = {
  name: 'Lokky',
  slug: 'Frontend', // slug historique du projet EAS : ne pas changer
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'lokky',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.nach17.Lokky',
    supportsTablet: false,
    googleServicesFile: './GoogleService-Info.plist',
    associatedDomains: ['applinks:lokky.akylian.com'],
    usesAppleSignIn: true,
    appleTeamId: '7UZ7GPX6A4',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription: LOCATION_TEXT,
      NSCameraUsageDescription: 'Lokky utilise ta caméra pour ta photo de profil.',
      NSPhotoLibraryUsageDescription: 'Lokky accède à tes photos pour ta photo de profil.',
    },
  },
  android: {
    package: 'com.nach17.lokky',
    googleServicesFile: './google-services.json',
    adaptiveIcon: { foregroundImage: './assets/icon.png', backgroundColor: '#FAF9F6' },
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'lokky.akylian.com', pathPrefix: '/activity' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: '#FAF9F6',
        dark: { backgroundColor: '#141A23' },
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: '7c688313-8128-4e0f-b8be-9766c1a6d9a5' } },
  runtimeVersion: { policy: 'appVersion' },
  updates: { url: 'https://u.expo.dev/7c688313-8128-4e0f-b8be-9766c1a6d9a5' },
};

export default config;
```

`apps/mobile/eas.json` :
```json
{
  "cli": { "version": ">= 18.0.1", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "env": { "EXPO_PUBLIC_API_MODE": "mock" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": { "EXPO_PUBLIC_API_MODE": "mock" }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  },
  "submit": { "production": {} }
}
```
> Le profil `production` ne définit volontairement aucune variable. Tant que le nouveau backend n'existe pas, un build de production échoue au démarrage (tâche 5) au lieu de partir avec des données simulées.

`apps/mobile/babel.config.js` :
```js
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
```

`apps/mobile/tsconfig.json` :
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Étape 5 : ESLint avec la règle de dépendances**

`apps/mobile/eslint.config.js` :
```js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const FEATURES = [
  'auth',
  'onboarding',
  'activities',
  'chat',
  'profile',
  'reviews',
  'moderation',
  'notifications',
  'settings',
  'dev',
];
const LAYERS = 'Sens des dépendances : app → features → ui | api | lib | theme | state (spec §4.3).';
const zone = (target, from) => ({ target, from, message: LAYERS });

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*', 'coverage/*'] },
  {
    settings: { 'import/resolver': { typescript: { project: './tsconfig.json' } } },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            zone('./src/ui', ['./src/features', './src/api', './src/state', './app']),
            zone('./src/theme', ['./src/features', './src/ui', './src/api', './src/state', './app']),
            zone('./src/lib', ['./src/features', './src/ui', './src/api', './src/theme', './src/state', './app']),
            zone('./src/api', ['./src/features', './src/ui', './src/state', './app']),
            zone('./src/state', ['./src/features', './src/ui', './src/api', './app']),
            zone('./src/features', './app'),
            ...FEATURES.map((feature) => ({
              target: `./src/features/${feature}`,
              from: './src/features',
              except: [`./${feature}`],
              message: 'Une feature n’importe pas une autre feature (spec §4.3).',
            })),
          ],
        },
      ],
    },
  },
]);
```

- [ ] **Étape 6 : configuration Jest**

`apps/mobile/jest.global-setup.js` :
```js
// Fuseau volontairement éloigné de Dakar (UTC+14) : prouve que l'app affiche
// l'heure de Dakar quel que soit le réglage du téléphone.
module.exports = () => {
  process.env.TZ = 'Pacific/Kiritimati';
};
```

`apps/mobile/jest.setup.ts` :
```ts
import { setUpTests } from 'react-native-reanimated';

setUpTests();

jest.mock('react-native-safe-area-context', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-safe-area-context/jest/mock').default,
);
```

- [ ] **Étape 7 : routes minimales et test de fumée**

`apps/mobile/app/_layout.tsx` :
```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`apps/mobile/app/index.tsx` :
```tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View>
      <Text>Lokky</Text>
    </View>
  );
}
```

`apps/mobile/src/__tests__/smoke.test.tsx` :
```tsx
import { render, screen } from '@testing-library/react-native';
import { LIMITS } from '@lokky/shared';
import Index from '../../app/index';

describe('socle', () => {
  it('rend l’écran d’accueil', async () => {
    await render(<Index />);
    expect(screen.getByText('Lokky')).toBeOnTheScreen();
  });

  it('lit le package partagé du monorepo', () => {
    expect(LIMITS.activity.capacityMax).toBe(20);
  });

  it('tourne bien dans un fuseau différent de Dakar', () => {
    expect(new Date('2026-10-07T23:00:00Z').getDate()).toBe(8);
  });
});
```
> Ce test importe `app/index` depuis `src/` : c'est toléré pour un test de fumée. Il est supprimé à la tâche 12, quand `app/index.tsx` change.

- [ ] **Étape 8 : vérifier**

Depuis `apps/mobile/` :
- `npm test` → 3 tests PASSENT.
- `npm run typecheck` → aucune erreur.
- `npm run lint` → aucune erreur.
- `npx expo-doctor` → tous les contrôles passent.

- [ ] **Étape 9 : prouver que la règle de dépendances fonctionne**

Créer temporairement `apps/mobile/src/ui/__probe.ts` :
```ts
export { default } from '../../app/index';
```
Lancer `npx eslint src/ui/__probe.ts`. Attendu : une erreur `import/no-restricted-paths` avec le message « Sens des dépendances… ». Si aucune erreur n'apparaît, le résolveur n'est pas pris en compte : vérifier l'installation de `eslint-import-resolver-typescript` avant de continuer. **Supprimer `__probe.ts` ensuite.**

- [ ] **Point de contrôle (pas de commit).**

---

### Tâche 5 : utilitaires `lib/` (environnement, dates, formatage)

**Fichiers :**
- Créer : `apps/mobile/src/lib/env.ts`, `dates.ts`, `format.ts`
- Tests : `apps/mobile/src/lib/__tests__/env.test.ts`, `dates.test.ts`, `format.test.ts`

**Interfaces consommées :** `startOfDakarDay`, type `ActivityCost` (`@lokky/shared`).

**Interfaces produites :**
- `type AppEnv = { apiMode: 'mock'; apiUrl: null } | { apiMode: 'http'; apiUrl: string }`, `parseEnv(raw: { apiMode?: string; apiUrl?: string }, isDev: boolean): AppEnv`, `env: AppEnv`
- `formatActivityWhen(startsAt: string | Date, now: Date): string`, `formatHour(date: Date): string`
- `formatFcfa(amount: number): string`, `formatCost(cost: ActivityCost): string`, `formatDistance(km: number): string`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`apps/mobile/src/lib/__tests__/env.test.ts` :
```ts
import { parseEnv } from '../env';

describe('parseEnv', () => {
  it('passe en mode simulé par défaut en développement', () => {
    expect(parseEnv({}, true)).toEqual({ apiMode: 'mock', apiUrl: null });
  });
  it('échoue sans mode explicite hors développement', () => {
    expect(() => parseEnv({}, false)).toThrow(/EXPO_PUBLIC_API_MODE/);
  });
  it('échoue sur un mode inconnu', () => {
    expect(() => parseEnv({ apiMode: 'prod' }, true)).toThrow(/EXPO_PUBLIC_API_MODE/);
  });
  it('échoue en mode http sans URL', () => {
    expect(() => parseEnv({ apiMode: 'http' }, true)).toThrow(/EXPO_PUBLIC_API_URL/);
  });
  it('échoue en mode http avec une URL sans protocole', () => {
    expect(() => parseEnv({ apiMode: 'http', apiUrl: 'api.lokky.sn' }, false)).toThrow(
      /EXPO_PUBLIC_API_URL/,
    );
  });
  it('retire la barre finale de l’URL', () => {
    expect(parseEnv({ apiMode: 'http', apiUrl: ' https://api.lokky.sn/v1/ ' }, false)).toEqual({
      apiMode: 'http',
      apiUrl: 'https://api.lokky.sn/v1',
    });
  });
});
```

`apps/mobile/src/lib/__tests__/dates.test.ts` :
```ts
import { formatActivityWhen } from '../dates';

// Mercredi 7 octobre 2026, 10h à Dakar. Jest tourne en UTC+14 (jest.global-setup.js).
const NOW = new Date('2026-10-07T10:00:00Z');
const when = (iso: string) => formatActivityWhen(iso, NOW);

describe('formatActivityWhen', () => {
  it('« Ce soir » à partir de 17h le jour même', () => {
    expect(when('2026-10-07T19:00:00Z')).toBe('Ce soir · 19h');
  });
  it('« Aujourd’hui » avant 17h, avec les minutes si besoin', () => {
    expect(when('2026-10-07T14:30:00Z')).toBe('Aujourd’hui · 14h30');
  });
  it('reste « Ce soir » à 23h à Dakar même si le téléphone est déjà au lendemain', () => {
    expect(when('2026-10-07T23:00:00Z')).toBe('Ce soir · 23h');
  });
  it('« Demain »', () => {
    expect(when('2026-10-08T18:00:00Z')).toBe('Demain · 18h');
  });
  it('le nom du jour dans la semaine qui vient', () => {
    expect(when('2026-10-10T17:00:00Z')).toBe('Samedi · 17h');
  });
  it('la date courte au-delà de 6 jours', () => {
    expect(when('2026-10-14T16:00:00Z')).toBe('14 oct. · 16h');
  });
  it('ajoute l’année si elle diffère', () => {
    expect(when('2027-01-03T10:05:00Z')).toBe('3 janv. 2027 · 10h05');
  });
  it('« Hier » pour la veille', () => {
    expect(when('2026-10-06T19:00:00Z')).toBe('Hier · 19h');
  });
});
```

`apps/mobile/src/lib/__tests__/format.test.ts` :
```ts
import { formatCost, formatDistance, formatFcfa } from '../format';

const NBSP = '\u00A0';

describe('formatFcfa', () => {
  it('groupe les milliers avec des espaces insécables', () => {
    expect(formatFcfa(3000)).toBe(`3${NBSP}000${NBSP}FCFA`);
    expect(formatFcfa(1250000)).toBe(`1${NBSP}250${NBSP}000${NBSP}FCFA`);
    expect(formatFcfa(500)).toBe(`500${NBSP}FCFA`);
  });
  it('arrondit à l’unité', () => {
    expect(formatFcfa(2999.6)).toBe(`3${NBSP}000${NBSP}FCFA`);
  });
});

describe('formatCost', () => {
  it('affiche « Gratuit »', () => {
    expect(formatCost({ type: 'free' })).toBe('Gratuit');
  });
  it('affiche « Chacun paie sa part » avec ou sans estimation', () => {
    expect(formatCost({ type: 'split' })).toBe('Chacun paie sa part');
    expect(formatCost({ type: 'split', estimateFcfa: 3000 })).toBe(
      `Chacun paie sa part (~3${NBSP}000${NBSP}FCFA)`,
    );
  });
});

describe('formatDistance', () => {
  it('en mètres sous 1 km, arrondi à 100 m, minimum 100 m', () => {
    expect(formatDistance(0.34)).toBe('300 m');
    expect(formatDistance(0.04)).toBe('100 m');
  });
  it('avec une décimale entre 1 et 10 km', () => {
    expect(formatDistance(2.44)).toBe('2,4 km');
  });
  it('sans décimale à partir de 10 km', () => {
    expect(formatDistance(12.6)).toBe('13 km');
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm test -- src/lib` depuis `apps/mobile/`
Attendu : ÉCHEC, modules introuvables.

- [ ] **Étape 3 : écrire les modules**

`apps/mobile/src/lib/env.ts` :
```ts
export type AppEnv = { apiMode: 'mock'; apiUrl: null } | { apiMode: 'http'; apiUrl: string };

export function parseEnv(raw: { apiMode?: string; apiUrl?: string }, isDev: boolean): AppEnv {
  const mode = raw.apiMode ?? (isDev ? 'mock' : undefined);
  if (mode !== 'mock' && mode !== 'http') {
    throw new Error(
      `EXPO_PUBLIC_API_MODE invalide : « ${String(raw.apiMode)} » (attendu : mock ou http).`,
    );
  }
  if (mode === 'mock') return { apiMode: 'mock', apiUrl: null };

  const url = raw.apiUrl?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error('EXPO_PUBLIC_API_URL doit être une URL http(s) en mode http.');
  }
  return { apiMode: 'http', apiUrl: url.replace(/\/+$/, '') };
}

// Accès direct obligatoire : Expo n'injecte que les `process.env.EXPO_PUBLIC_*` écrits en toutes lettres.
export const env = parseEnv(
  { apiMode: process.env.EXPO_PUBLIC_API_MODE, apiUrl: process.env.EXPO_PUBLIC_API_URL },
  __DEV__,
);
```

`apps/mobile/src/lib/dates.ts` :
```ts
import { startOfDakarDay } from '@lokky/shared';

// Heure de Dakar = UTC+0 : uniquement des accesseurs UTC, jamais l'heure locale du téléphone.
const DAY_MS = 86_400_000;
const EVENING_HOUR = 17;
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

export function formatHour(date: Date): string {
  const minutes = date.getUTCMinutes();
  return `${date.getUTCHours()}h${minutes === 0 ? '' : String(minutes).padStart(2, '0')}`;
}

function formatShortDate(date: Date, now: Date): string {
  const base = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  return date.getUTCFullYear() === now.getUTCFullYear() ? base : `${base} ${date.getUTCFullYear()}`;
}

export function formatActivityWhen(startsAt: string | Date, now: Date): string {
  const date = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  const dayDiff = Math.round(
    (startOfDakarDay(date).getTime() - startOfDakarDay(now).getTime()) / DAY_MS,
  );
  const hour = formatHour(date);

  if (dayDiff === 0) {
    return date.getUTCHours() >= EVENING_HOUR ? `Ce soir · ${hour}` : `Aujourd’hui · ${hour}`;
  }
  if (dayDiff === 1) return `Demain · ${hour}`;
  if (dayDiff === -1) return `Hier · ${hour}`;
  if (dayDiff > 1 && dayDiff <= 6) return `${WEEKDAYS[date.getUTCDay()]} · ${hour}`;
  return `${formatShortDate(date, now)} · ${hour}`;
}
```

`apps/mobile/src/lib/format.ts` :
```ts
import type { ActivityCost } from '@lokky/shared';

const NBSP = '\u00A0';

export function formatFcfa(amount: number): string {
  const grouped = String(Math.round(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${amount < 0 ? '-' : ''}${grouped}${NBSP}FCFA`;
}

export function formatCost(cost: ActivityCost): string {
  if (cost.type === 'free') return 'Gratuit';
  return cost.estimateFcfa === undefined
    ? 'Chacun paie sa part'
    : `Chacun paie sa part (~${formatFcfa(cost.estimateFcfa)})`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m`;
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}
```

- [ ] **Étape 4 : relancer les tests**

Lancer : `npm test -- src/lib` puis `npm run typecheck`
Attendu : tout PASSE. Si le test « Ce soir · 23h » échoue en affichant « Demain », un accesseur local (`getHours`, `getDate`…) s'est glissé au lieu de sa version UTC.

- [ ] **Point de contrôle (pas de commit).**

---
### Tâche 6 : couche API (erreurs, client HTTP, client de requêtes)

**Fichiers :**
- Créer : `apps/mobile/src/api/types.ts`, `errors.ts`, `httpClient.ts`, `queryClient.ts`
- Tests : `apps/mobile/src/api/__tests__/httpClient.test.ts`, `queryClient.test.ts`

**Interfaces consommées :** `routes`, `buildRequest`, `toQueryString`, `apiErrorBodySchema`, types `RouteName`, `RouteInput`, `RouteOutput`, `ApiErrorCode` (`@lokky/shared`).

**Interfaces produites :**
- `interface ApiClient { request<R extends RouteName>(route: R, input: RouteInput<R>): Promise<RouteOutput<R>> }`
- `class ApiError extends Error { code: ClientErrorCode; status: number | null }`, `type ClientErrorCode = ApiErrorCode | 'network' | 'timeout' | 'invalid_response'`, `isApiError(e)`, `isRetryable(e)`
- `createHttpClient(options: HttpClientOptions): ApiClient`, `HttpClientOptions = { baseUrl: string; getAccessToken: () => string | null | Promise<string | null>; fetchFn?: typeof fetch; timeoutMs?: number }`
- `createQueryClient(): QueryClient`, `shouldRetry(failureCount: number, error: unknown): boolean`, `setupFocusManager(): () => void`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`apps/mobile/src/api/__tests__/httpClient.test.ts` :
```ts
import { ApiError } from '../errors';
import { createHttpClient } from '../httpClient';

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit]>;

const response = (body: unknown, status = 200, json = true) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: json ? async () => body : async () => Promise.reject(new SyntaxError('not json')),
  }) as unknown as Response;

const user = {
  id: 'u1',
  firstName: 'Awa',
  avatarUrl: null,
  status: 'student',
  neighborhood: 'fann',
  interests: ['beach'],
  trust: {
    activitiesAttended: 0,
    attendanceRate: null,
    activitiesCreated: 0,
    creatorRating: null,
    creatorReviewCount: 0,
  },
};

function setup(fetchImpl: (url: string, init: RequestInit) => Promise<Response>) {
  const fetchFn: FetchMock = jest.fn(fetchImpl);
  const client = createHttpClient({
    baseUrl: 'https://api.test',
    getAccessToken: () => 'tok',
    fetchFn: fetchFn as unknown as typeof fetch,
  });
  return { client, fetchFn };
}

describe('createHttpClient', () => {
  it('construit l’URL avec le paramètre de chemin et ajoute le jeton', async () => {
    const { client, fetchFn } = setup(async () => response(user));
    await expect(client.request('users.get', { id: 'u 1' })).resolves.toMatchObject({ id: 'u1' });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.test/users/u%201');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('sérialise les filtres en query', async () => {
    const { client, fetchFn } = setup(async () => response({ items: [], nextCursor: null }));
    await client.request('activities.list', {
      when: 'tonight',
      categories: ['sport', 'beach'],
      freeOnly: true,
    });
    expect(fetchFn.mock.calls[0]![0]).toBe(
      'https://api.test/activities?when=tonight&categories=sport&categories=beach&freeOnly=true',
    );
  });

  it('envoie un body normalisé et pas de jeton sur une route publique', async () => {
    const { client, fetchFn } = setup(async () => response({ ok: true }));
    await client.request('auth.emailStart', { email: ' Awa@Gmail.com ' });
    const init = fetchFn.mock.calls[0]![1];
    expect(init.body).toBe('{"email":"awa@gmail.com"}');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('transforme une erreur de l’API en ApiError avec son code', async () => {
    const { client } = setup(async () =>
      response({ error: { code: 'activity_full', message: 'Complet' } }, 409),
    );
    await expect(client.request('activities.join', { id: 'a1' })).rejects.toMatchObject({
      code: 'activity_full',
      status: 409,
    });
  });

  it('renvoie internal si le corps d’erreur n’est pas lisible', async () => {
    const { client } = setup(async () => response(null, 502, false));
    await expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
      code: 'internal',
      status: 502,
    });
  });

  it('refuse une réponse qui ne respecte pas le contrat', async () => {
    const { client } = setup(async () => response({ id: 'u1' }));
    await expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('renvoie network si la requête échoue', async () => {
    const { client } = setup(async () => {
      throw new TypeError('Network request failed');
    });
    await expect(client.request('users.get', { id: 'u1' })).rejects.toBeInstanceOf(ApiError);
    await expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
      code: 'network',
    });
  });

  it('abandonne au bout de 15 s avec timeout', async () => {
    jest.useFakeTimers();
    try {
      const { client } = setup(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      );
      const assertion = expect(client.request('users.get', { id: 'u1' })).rejects.toMatchObject({
        code: 'timeout',
      });
      await jest.advanceTimersByTimeAsync(15_000);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });
});
```

`apps/mobile/src/api/__tests__/queryClient.test.ts` :
```ts
import { ApiError } from '../errors';
import { shouldRetry } from '../queryClient';

describe('shouldRetry', () => {
  it('relance les erreurs réseau, timeout et serveur, deux fois au plus', () => {
    expect(shouldRetry(0, new ApiError('network', 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError('timeout', 'x'))).toBe(true);
    expect(shouldRetry(0, new ApiError('internal', 'x', 500))).toBe(true);
    expect(shouldRetry(2, new ApiError('network', 'x'))).toBe(false);
  });
  it('ne relance pas les erreurs métier ni les erreurs inconnues', () => {
    expect(shouldRetry(0, new ApiError('not_found', 'x', 404))).toBe(false);
    expect(shouldRetry(0, new ApiError('activity_full', 'x', 409))).toBe(false);
    expect(shouldRetry(0, new Error('bug'))).toBe(false);
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm test -- src/api` depuis `apps/mobile/`
Attendu : ÉCHEC, modules introuvables.

- [ ] **Étape 3 : écrire les modules**

`apps/mobile/src/api/types.ts` :
```ts
import type { RouteInput, RouteName, RouteOutput } from '@lokky/shared';

export interface ApiClient {
  request<R extends RouteName>(route: R, input: RouteInput<R>): Promise<RouteOutput<R>>;
}
```

`apps/mobile/src/api/errors.ts` :
```ts
import type { ApiErrorCode } from '@lokky/shared';

export type ClientErrorCode = ApiErrorCode | 'network' | 'timeout' | 'invalid_response';

export class ApiError extends Error {
  readonly code: ClientErrorCode;
  readonly status: number | null;

  constructor(code: ClientErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

const RETRYABLE: readonly ClientErrorCode[] = ['network', 'timeout', 'internal', 'rate_limited'];
export const isRetryable = (error: unknown) => isApiError(error) && RETRYABLE.includes(error.code);
```

`apps/mobile/src/api/httpClient.ts` :
```ts
import {
  apiErrorBodySchema,
  buildRequest,
  routes,
  toQueryString,
  type RouteInput,
  type RouteName,
  type RouteOutput,
} from '@lokky/shared';
import { ApiError } from './errors';
import type { ApiClient } from './types';

export interface HttpClientOptions {
  baseUrl: string;
  getAccessToken: () => string | null | Promise<string | null>;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export function createHttpClient({
  baseUrl,
  getAccessToken,
  fetchFn = fetch,
  timeoutMs = 15_000,
}: HttpClientOptions): ApiClient {
  async function request<R extends RouteName>(
    name: R,
    input: RouteInput<R>,
  ): Promise<RouteOutput<R>> {
    const def = routes[name];
    // Valider avant l'envoi : détecte les bugs côté app et applique les normalisations (trim…).
    const parsed = def.input.parse(input) as Record<string, unknown>;
    const req = buildRequest(def, parsed);
    const url = `${baseUrl}${req.path}${req.query ? `?${toQueryString(req.query)}` : ''}`;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (req.body) headers['Content-Type'] = 'application/json';
    if (def.auth) {
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetchFn(url, {
        method: req.method,
        headers,
        body: req.body ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw controller.signal.aborted
        ? new ApiError('timeout', 'La requête a pris trop de temps.')
        : new ApiError('network', 'Connexion impossible.');
    } finally {
      clearTimeout(timer);
    }

    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const body = apiErrorBodySchema.safeParse(json);
      if (body.success) throw new ApiError(body.data.error.code, body.data.error.message, res.status);
      throw new ApiError('internal', `Erreur HTTP ${res.status}`, res.status);
    }

    const output = def.output.safeParse(json);
    if (!output.success) {
      throw new ApiError('invalid_response', `Réponse hors contrat pour ${name}`, res.status);
    }
    return output.data as RouteOutput<R>;
  }

  return { request };
}
```

`apps/mobile/src/api/queryClient.ts` :
```ts
import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { isRetryable } from './errors';

const MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  return isRetryable(error) && failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}

// Resynchronise les données quand l'app revient au premier plan (remplace le polling).
export function setupFocusManager(): () => void {
  const subscription = AppState.addEventListener('change', (state) => {
    focusManager.setFocused(state === 'active');
  });
  return () => subscription.remove();
}
```

- [ ] **Étape 4 : relancer**

Lancer : `npm test -- src/api` puis `npm run typecheck`
Attendu : tout PASSE.

- [ ] **Point de contrôle (pas de commit).**

---

### Tâche 7 : client simulé et jeu de données de Dakar

**Fichiers :**
- Créer : `apps/mobile/src/api/mock/db.ts`, `seed.ts`, `serializers.ts`, `handlers.ts`, `mockClient.ts`
- Créer : `apps/mobile/src/api/client.ts`
- Test : `apps/mobile/src/api/mock/__tests__/mockClient.test.ts`

**Interfaces consommées :** `ApiClient`, `ApiError` (tâche 6), `env` (tâche 5), `routes`, `getWhenRange`, `getActivityStatus`, `haversineKm`, `startOfDakarDay`, `LIMITS`, types partagés.

**Interfaces produites :**
- `type MockUser = User & { email: string; birthDate: string }`, `interface MockActivity`, `interface MockDb { users: Map<string, MockUser>; activities: Map<string, MockActivity> }`, `createMockDb(now: Date): MockDb`
- `MOCK_VIEWER_ID = 'u_awa'`, `buildSeed(now: Date)`
- `toUserPreview`, `toPublicUser`, `toActivity(a, db, viewerId, now, origin)`
- `interface MockContext { db: MockDb; now: () => Date; viewerId: string }`, `type MockHandler<R>`, `type MockHandlers`, `createMockClient(options: MockClientOptions): ApiClient`, `mockHandlers: MockHandlers`, `paginate(items, cursor?, limit?)`
- `apiClient: ApiClient` (choisi selon `env.apiMode`)

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`apps/mobile/src/api/mock/__tests__/mockClient.test.ts` :
```ts
import { ApiError } from '../../errors';
import { createMockDb } from '../db';
import { mockHandlers } from '../handlers';
import { createMockClient } from '../mockClient';

// Mercredi 7 octobre 2026, 10h (Dakar). Samedi = 10 oct., dimanche = 11 oct.
const NOW = new Date('2026-10-07T10:00:00Z');
const UCAD = { lat: 14.6925, lng: -17.4625 };

function makeClient(overrides: { failureRate?: number; handlers?: typeof mockHandlers } = {}) {
  return createMockClient({
    handlers: overrides.handlers ?? mockHandlers,
    db: createMockDb(NOW),
    now: () => NOW,
    sleep: () => Promise.resolve(),
    random: () => 0.5,
    failureRate: overrides.failureRate ?? 0,
  });
}

const ids = (page: { items: { id: string }[] }) => page.items.map((a) => a.id);

describe('client simulé : activités', () => {
  it('« ce soir » ne renvoie que les activités du jour, triées par heure', async () => {
    const page = await makeClient().request('activities.list', { when: 'tonight' });
    expect(ids(page)).toEqual(['a_foot', 'a_cine']);
  });

  it('« ce week-end » renvoie samedi et dimanche', async () => {
    const page = await makeClient().request('activities.list', { when: 'weekend' });
    expect(ids(page)).toEqual(['a_mamelles', 'a_concert', 'a_ngor']);
  });

  it('« gratuit » exclut les activités payantes', async () => {
    const page = await makeClient().request('activities.list', { when: 'tonight', freeOnly: true });
    expect(ids(page)).toEqual(['a_foot']);
  });

  it('exclut les activités passées et annulées', async () => {
    const page = await makeClient().request('activities.list', { limit: 50 });
    expect(ids(page)).not.toContain('a_footing');
    expect(ids(page)).not.toContain('a_goree');
    expect(page.items).toHaveLength(9);
  });

  it('filtre par distance et calcule distanceKm', async () => {
    const page = await makeClient().request('activities.list', { ...UCAD, radiusKm: 3 });
    expect(ids(page)).toEqual(['a_cine', 'a_bu', 'a_jeux', 'a_thieb']);
    expect(page.items.find((a) => a.id === 'a_bu')?.distanceKm).toBe(0);
  });

  it('pagine avec un curseur', async () => {
    const client = makeClient();
    const p1 = await client.request('activities.list', { limit: 4 });
    expect(p1.items).toHaveLength(4);
    expect(p1.nextCursor).toBe('4');
    const p3 = await client.request('activities.list', { limit: 4, cursor: '8' });
    expect(p3.items).toHaveLength(1);
    expect(p3.nextCursor).toBeNull();
  });

  it('refuse un curseur invalide', async () => {
    await expect(
      makeClient().request('activities.list', { cursor: 'abc' }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('calcule l’état de l’utilisateur courant', async () => {
    const client = makeClient();
    const full = await client.request('activities.get', { id: 'a_concert' });
    expect(full.viewerState).toMatchObject({ isParticipant: false, canJoin: false });
    const mine = await client.request('activities.get', { id: 'a_thieb' });
    expect(mine.viewerState).toMatchObject({ isCreator: true, canLeave: false });
    const past = await client.request('activities.get', { id: 'a_footing' });
    expect(past.status).toBe('past');
    expect(past.viewerState.canReview).toBe(true);
    const cancelled = await client.request('activities.get', { id: 'a_goree' });
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.viewerState.canJoin).toBe(false);
  });

  it('compte les participants qui découvrent Lokky', async () => {
    const foot = await makeClient().request('activities.get', { id: 'a_foot' });
    expect(foot.firstTimerCount).toBe(1);
  });

  it('renvoie not_found pour une activité inconnue', async () => {
    await expect(makeClient().request('activities.get', { id: 'nope' })).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});

describe('client simulé : comportement général', () => {
  it('chaque activité du jeu de données respecte le contrat', async () => {
    const client = makeClient();
    for (const id of ['a_foot', 'a_footing', 'a_goree', 'a_concert']) {
      await expect(client.request('activities.get', { id })).resolves.toBeDefined();
    }
  });

  it('signale clairement une route non simulée', async () => {
    await expect(makeClient().request('me.get', {})).rejects.toThrow(/Route non simulée : me.get/);
  });

  it('simule une panne réseau selon failureRate', async () => {
    const error = await makeClient({ failureRate: 1 })
      .request('activities.get', { id: 'a_foot' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'network' });
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm test -- src/api/mock` depuis `apps/mobile/`
Attendu : ÉCHEC, modules introuvables.

- [ ] **Étape 3 : écrire `db.ts` et `seed.ts`**

`apps/mobile/src/api/mock/db.ts` :
```ts
import type {
  ActivityCategory,
  ActivityCost,
  ActivityLocation,
  City,
  User,
} from '@lokky/shared';
import { buildSeed } from './seed';

export type MockUser = User & { email: string; birthDate: string };

export interface MockActivity {
  id: string;
  title: string;
  category: ActivityCategory;
  description: string;
  startsAt: string;
  location: ActivityLocation;
  capacity: number;
  cost: ActivityCost;
  creatorId: string;
  participantIds: string[]; // le créateur en fait partie
  cancelledAt: string | null;
  city: City;
  createdAt: string;
}

export interface MockDb {
  users: Map<string, MockUser>;
  activities: Map<string, MockActivity>;
}

export function createMockDb(now: Date): MockDb {
  const { users, activities } = buildSeed(now);
  return {
    users: new Map(users.map((u) => [u.id, u])),
    activities: new Map(activities.map((a) => [a.id, a])),
  };
}
```

`apps/mobile/src/api/mock/seed.ts` :
```ts
import {
  startOfDakarDay,
  type ActivityLocation,
  type ActivityCategory,
  type NeighborhoodId,
  type TrustStats,
  type UserStatus,
} from '@lokky/shared';
import type { MockActivity, MockUser } from './db';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const MOCK_VIEWER_ID = 'u_awa';

const trust = (
  activitiesAttended: number,
  attendanceRate: number | null,
  activitiesCreated: number,
  creatorRating: number | null,
  creatorReviewCount: number,
): TrustStats => ({
  activitiesAttended,
  attendanceRate,
  activitiesCreated,
  creatorRating,
  creatorReviewCount,
});

const user = (
  id: string,
  firstName: string,
  status: UserStatus,
  neighborhood: NeighborhoodId,
  interests: ActivityCategory[],
  stats: TrustStats,
  birthDate: string,
): MockUser => ({
  id,
  firstName,
  avatarUrl: null,
  status,
  neighborhood,
  interests,
  trust: stats,
  email: `${id.slice(2)}@exemple.sn`,
  birthDate,
});

const USERS: MockUser[] = [
  user('u_awa', 'Awa', 'student', 'fann', ['beach', 'music', 'cinema'], trust(4, 1, 1, null, 0), '2004-03-12'),
  user('u_moussa', 'Moussa', 'newcomer', 'yoff', ['sport', 'beach', 'walk'], trust(12, 0.95, 9, 4.8, 21), '1999-07-02'),
  user('u_fatou', 'Fatou', 'student', 'point-e', ['study', 'culture', 'food'], trust(7, 0.86, 3, 4.6, 8), '2003-11-25'),
  user('u_ibrahima', 'Ibrahima', 'other', 'ouakam', ['sport', 'games', 'music'], trust(0, null, 0, null, 0), '2001-01-15'),
  user('u_aminata', 'Aminata', 'newcomer', 'almadies', ['food', 'walk', 'culture'], trust(2, 1, 1, null, 0), '1998-05-30'),
  user('u_cheikh', 'Cheikh', 'student', 'medina', ['music', 'games', 'sport'], trust(20, 0.9, 14, 4.9, 40), '2002-09-09'),
  user('u_mariama', 'Mariama', 'student', 'sacre-coeur', ['cinema', 'food', 'beach'], trust(0, null, 1, null, 0), '2005-02-18'),
  user('u_ousmane', 'Ousmane', 'newcomer', 'ngor', ['beach', 'walk', 'sport'], trust(5, 0.8, 3, 4.2, 5), '2000-12-01'),
];

type Place = Omit<ActivityLocation, 'meetingPoint'>;
const PLACES = {
  yoff: { name: 'Plage de Yoff', coordinates: { lat: 14.758, lng: -17.473 }, neighborhood: 'yoff' },
  corniche: { name: 'Corniche Ouest', coordinates: { lat: 14.693, lng: -17.475 }, neighborhood: 'fann' },
  bu: { name: 'Bibliothèque universitaire de l’UCAD', coordinates: { lat: 14.6925, lng: -17.4625 }, neighborhood: 'fann' },
  pointE: { name: 'Café du Point E', coordinates: { lat: 14.696, lng: -17.457 }, neighborhood: 'point-e' },
  mamelles: { name: 'Phare des Mamelles', coordinates: { lat: 14.724, lng: -17.504 }, neighborhood: 'ouakam' },
  institut: { name: 'Institut français de Dakar', coordinates: { lat: 14.667, lng: -17.435 }, neighborhood: 'plateau' },
  ngor: { name: 'Plage de Ngor', coordinates: { lat: 14.7535, lng: -17.516 }, neighborhood: 'ngor' },
  kermel: { name: 'Marché Kermel', coordinates: { lat: 14.6675, lng: -17.43 }, neighborhood: 'plateau' },
  medina: { name: 'Restaurant de la Médina', coordinates: { lat: 14.683, lng: -17.45 }, neighborhood: 'medina' },
  goree: { name: 'Embarcadère de Gorée', coordinates: { lat: 14.673, lng: -17.428 }, neighborhood: 'plateau' },
} satisfies Record<string, Place>;

const at = (place: Place, meetingPoint: string | null = null): ActivityLocation => ({
  ...place,
  meetingPoint,
});

export function buildSeed(now: Date): { users: MockUser[]; activities: MockActivity[] } {
  const today = startOfDakarDay(now).getTime();
  const day = (offset: number, hour: number, minute = 0) =>
    new Date(today + offset * DAY + hour * HOUR + minute * MIN).toISOString();
  const todayAt = (hour: number) => day(0, hour);
  // 0 = aujourd'hui si c'est déjà ce jour-là
  const daysUntil = (weekday: number) => (weekday - now.getUTCDay() + 7) % 7;
  const createdAt = new Date(now.getTime() - 2 * DAY).toISOString();

  const activity = (
    a: Omit<MockActivity, 'cancelledAt' | 'city' | 'createdAt' | 'description'> &
      Partial<Pick<MockActivity, 'cancelledAt' | 'description'>>,
  ): MockActivity => ({ cancelledAt: null, city: 'dakar', createdAt, description: '', ...a });

  const activities: MockActivity[] = [
    activity({
      id: 'a_foot', title: 'Foot à la plage', category: 'sport', startsAt: todayAt(17),
      location: at(PLACES.yoff, 'Devant le poste de secours'), capacity: 10, cost: { type: 'free' },
      description: 'Petit match tranquille, tous niveaux. Après, on chill et on fait connaissance !',
      creatorId: 'u_moussa', participantIds: ['u_moussa', 'u_ibrahima', 'u_ousmane', 'u_cheikh', 'u_aminata', 'u_fatou'],
    }),
    activity({
      id: 'a_cine', title: 'Ciné en plein air', category: 'cinema', startsAt: todayAt(19),
      location: at(PLACES.corniche), capacity: 10, cost: { type: 'split', estimateFcfa: 3000 },
      creatorId: 'u_mariama', participantIds: ['u_mariama', 'u_aminata', 'u_ibrahima'],
    }),
    activity({
      id: 'a_bu', title: 'Révisions de partiels à la BU', category: 'study', startsAt: day(1, 10),
      location: at(PLACES.bu, 'Entrée principale'), capacity: 6, cost: { type: 'free' },
      creatorId: 'u_fatou', participantIds: ['u_fatou', 'u_awa'],
    }),
    activity({
      id: 'a_jeux', title: 'Thé et jeux de société', category: 'games', startsAt: day(1, 18, 30),
      location: at(PLACES.pointE), capacity: 8, cost: { type: 'split', estimateFcfa: 1500 },
      creatorId: 'u_cheikh', participantIds: ['u_cheikh', 'u_ibrahima', 'u_mariama'],
    }),
    activity({
      id: 'a_kermel', title: 'Balade au marché Kermel', category: 'culture', startsAt: day(2, 10),
      location: at(PLACES.kermel), capacity: 8, cost: { type: 'free' },
      creatorId: 'u_aminata', participantIds: ['u_aminata'],
    }),
    activity({
      id: 'a_mamelles', title: 'Coucher de soleil aux Mamelles', category: 'walk', startsAt: day(daysUntil(6), 17),
      location: at(PLACES.mamelles, 'Parking du phare'), capacity: 12, cost: { type: 'free' },
      creatorId: 'u_ousmane', participantIds: ['u_ousmane', 'u_aminata', 'u_awa', 'u_moussa'],
    }),
    activity({
      id: 'a_concert', title: 'Soirée concert live', category: 'music', startsAt: day(daysUntil(6), 21),
      location: at(PLACES.institut), capacity: 6, cost: { type: 'split', estimateFcfa: 5000 },
      creatorId: 'u_cheikh', participantIds: ['u_cheikh', 'u_fatou', 'u_mariama', 'u_ousmane', 'u_moussa', 'u_aminata'],
    }),
    activity({
      id: 'a_ngor', title: 'Baignade à Ngor', category: 'beach', startsAt: day(daysUntil(0), 11),
      location: at(PLACES.ngor), capacity: 15, cost: { type: 'free' },
      creatorId: 'u_ousmane', participantIds: ['u_ousmane'],
    }),
    activity({
      id: 'a_thieb', title: 'Thieb entre potes', category: 'food', startsAt: day(5, 13),
      location: at(PLACES.medina), capacity: 6, cost: { type: 'split', estimateFcfa: 2500 },
      creatorId: 'u_awa', participantIds: ['u_awa', 'u_fatou'],
    }),
    activity({
      id: 'a_footing', title: 'Footing sur la Corniche', category: 'sport', startsAt: day(-2, 7),
      location: at(PLACES.corniche), capacity: 10, cost: { type: 'free' },
      creatorId: 'u_moussa', participantIds: ['u_moussa', 'u_awa', 'u_ousmane'],
    }),
    activity({
      id: 'a_goree', title: 'Visite de Gorée', category: 'culture', startsAt: day(2, 9),
      location: at(PLACES.goree), capacity: 10, cost: { type: 'split', estimateFcfa: 5200 },
      creatorId: 'u_fatou', participantIds: ['u_fatou'],
      cancelledAt: new Date(now.getTime() - HOUR).toISOString(),
    }),
  ];

  return { users: USERS, activities };
}
```
> Prettier remettra chaque objet sur plusieurs lignes. Les heures sont relatives à `now` : en développement, « Ce soir » contient toujours quelque chose tant qu'on ouvre l'app avant 17h.

- [ ] **Étape 4 : écrire `serializers.ts`, `mockClient.ts`, `handlers.ts`, `client.ts`**

`apps/mobile/src/api/mock/serializers.ts` :
```ts
import {
  getActivityStatus,
  haversineKm,
  LIMITS,
  type Activity,
  type Coordinates,
  type User,
  type UserPreview,
} from '@lokky/shared';
import type { MockActivity, MockDb, MockUser } from './db';

export const toUserPreview = (u: MockUser): UserPreview => ({
  id: u.id,
  firstName: u.firstName,
  avatarUrl: u.avatarUrl,
});

export const toPublicUser = (u: MockUser): User => ({
  ...toUserPreview(u),
  status: u.status,
  neighborhood: u.neighborhood,
  interests: u.interests,
  trust: u.trust,
});

function getUser(db: MockDb, id: string): MockUser {
  const found = db.users.get(id);
  if (!found) throw new Error(`Utilisateur simulé introuvable : ${id}`);
  return found;
}

export function toActivity(
  a: MockActivity,
  db: MockDb,
  viewerId: string,
  now: Date,
  origin: Coordinates | null,
): Activity {
  const creator = getUser(db, a.creatorId);
  const participants = a.participantIds.map((id) => getUser(db, id));
  const status = getActivityStatus(
    new Date(a.startsAt),
    a.cancelledAt ? new Date(a.cancelledAt) : null,
    now,
  );
  const isParticipant = a.participantIds.includes(viewerId);
  const isCreator = a.creatorId === viewerId;
  const isFull = participants.length >= a.capacity;
  const upcoming = status === 'upcoming';

  return {
    id: a.id,
    title: a.title,
    category: a.category,
    description: a.description,
    startsAt: a.startsAt,
    location: a.location,
    capacity: a.capacity,
    cost: a.cost,
    creator: { ...toUserPreview(creator), trust: creator.trust },
    participantCount: participants.length,
    participantsPreview: participants
      .slice(0, LIMITS.activity.participantsPreviewMax)
      .map(toUserPreview),
    firstTimerCount: participants.filter(
      (p) => p.id !== viewerId && p.trust.activitiesAttended === 0,
    ).length,
    status,
    city: a.city,
    distanceKm: origin
      ? Math.round(haversineKm(origin, a.location.coordinates) * 10) / 10
      : null,
    viewerState: {
      isParticipant,
      isCreator,
      canJoin: upcoming && !isParticipant && !isFull,
      canLeave: upcoming && isParticipant && !isCreator,
      canReview: status === 'past' && isParticipant && !isCreator,
    },
    createdAt: a.createdAt,
  };
}
```

`apps/mobile/src/api/mock/mockClient.ts` :
```ts
import {
  routes,
  type RouteInput,
  type RouteName,
  type RouteOutput,
  type RouteParsedInput,
} from '@lokky/shared';
import { ApiError } from '../errors';
import type { ApiClient } from '../types';
import type { MockDb } from './db';
import { MOCK_VIEWER_ID } from './seed';

export interface MockContext {
  db: MockDb;
  now: () => Date;
  viewerId: string;
}

export type MockHandler<R extends RouteName> = (
  input: RouteParsedInput<R>,
  ctx: MockContext,
) => RouteOutput<R> | Promise<RouteOutput<R>>;

export type MockHandlers = { [R in RouteName]?: MockHandler<R> };

export interface MockClientOptions {
  handlers: MockHandlers;
  db: MockDb;
  viewerId?: string;
  now?: () => Date;
  latencyMs?: readonly [number, number];
  failureRate?: number;
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export function createMockClient({
  handlers,
  db,
  viewerId = MOCK_VIEWER_ID,
  now = () => new Date(),
  latencyMs = [200, 600],
  failureRate = 0,
  random = Math.random,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}: MockClientOptions): ApiClient {
  async function request<R extends RouteName>(
    name: R,
    input: RouteInput<R>,
  ): Promise<RouteOutput<R>> {
    const def = routes[name];
    const parsed = def.input.parse(input) as RouteParsedInput<R>;
    await sleep(latencyMs[0] + random() * (latencyMs[1] - latencyMs[0]));
    if (random() < failureRate) throw new ApiError('network', 'Erreur réseau simulée.');

    const handler = handlers[name] as MockHandler<R> | undefined;
    if (!handler) throw new ApiError('internal', `Route non simulée : ${name}`, 501);
    const result = await handler(parsed, { db, now, viewerId });
    // Garantit que les données simulées respectent le contrat, comme le ferait le vrai backend.
    return def.output.parse(result) as RouteOutput<R>;
  }

  return { request };
}
```

`apps/mobile/src/api/mock/handlers.ts` :
```ts
import { getWhenRange, haversineKm, LIMITS, type Paginated } from '@lokky/shared';
import { ApiError } from '../errors';
import type { MockHandlers } from './mockClient';
import { toActivity, toPublicUser } from './serializers';

export function paginate<T>(items: T[], cursor?: string, limit?: number): Paginated<T> {
  const size = limit ?? LIMITS.pagination.defaultLimit;
  const offset = cursor === undefined ? 0 : Number(cursor);
  if (!Number.isInteger(offset) || offset < 0) {
    throw new ApiError('validation', 'Curseur invalide.', 400);
  }
  const end = offset + size;
  return { items: items.slice(offset, end), nextCursor: end < items.length ? String(end) : null };
}

// Jalon 1 : lecture des activités et des profils. Les jalons suivants ajoutent leurs handlers.
export const mockHandlers: MockHandlers = {
  'activities.list': (input, { db, now, viewerId }) => {
    const n = now();
    const { from, to } = getWhenRange(input.when ?? 'all', n);
    const origin =
      input.lat !== undefined && input.lng !== undefined ? { lat: input.lat, lng: input.lng } : null;
    const radius = input.radiusKm ?? LIMITS.activity.defaultRadiusKm;

    const items = [...db.activities.values()]
      .filter((a) => a.cancelledAt === null)
      .filter((a) => {
        const t = new Date(a.startsAt).getTime();
        return t >= from.getTime() && (to === null || t <= to.getTime());
      })
      .filter((a) => !input.categories?.length || input.categories.includes(a.category))
      .filter((a) => !input.freeOnly || a.cost.type === 'free')
      .filter((a) => !origin || haversineKm(origin, a.location.coordinates) <= radius)
      .sort((x, y) => x.startsAt.localeCompare(y.startsAt))
      .map((a) => toActivity(a, db, viewerId, n, origin));

    return paginate(items, input.cursor, input.limit);
  },

  'activities.get': ({ id }, { db, now, viewerId }) => {
    const activity = db.activities.get(id);
    if (!activity) throw new ApiError('not_found', 'Activité introuvable.', 404);
    return toActivity(activity, db, viewerId, now(), null);
  },

  'users.get': ({ id }, { db }) => {
    const found = db.users.get(id);
    if (!found) throw new ApiError('not_found', 'Utilisateur introuvable.', 404);
    return toPublicUser(found);
  },
};
```

`apps/mobile/src/api/client.ts` :
```ts
import { env } from '@/lib/env';
import { createHttpClient } from './httpClient';
import { createMockDb } from './mock/db';
import { mockHandlers } from './mock/handlers';
import { createMockClient } from './mock/mockClient';
import type { ApiClient } from './types';

export const apiClient: ApiClient =
  env.apiMode === 'mock'
    ? createMockClient({ handlers: mockHandlers, db: createMockDb(new Date()) })
    : createHttpClient({
        baseUrl: env.apiUrl,
        getAccessToken: () => null, // branché sur la session au jalon 2
      });
```

- [ ] **Étape 5 : relancer**

Lancer : `npm test -- src/api` puis `npm run typecheck` et `npm run lint`
Attendu : tout PASSE. Si le test de distance échoue sur l'ordre, vérifier le tri par `startsAt` (chaînes ISO en `Z`, donc comparables directement).

- [ ] **Point de contrôle (pas de commit).**

---
### Tâche 8 : thème (tokens, clair / sombre, contraste, polices, préférences)

**Fichiers :**
- Créer : `apps/mobile/src/theme/tokens.ts`, `themes.ts`, `contrast.ts`, `ThemeProvider.tsx`, `makeStyles.ts`, `fonts.ts`, `index.ts`
- Créer : `apps/mobile/src/state/preferences.ts`
- Créer : `apps/mobile/src/test/render.tsx` (le `ToastProvider` y sera ajouté à la tâche 11)
- Tests : `apps/mobile/src/theme/__tests__/themes.test.ts`, `ThemeProvider.test.tsx`

**Interfaces produites :**
- `palette`, `spacing`, `radius`, `fontFamilies`, `typography`, `motion`, `MAX_FONT_SCALE = 1.3`
- `interface ThemeColors`, `interface Theme { scheme; colors; spacing; radius; typography; shadow: { card: string | null } }`, `lightTheme`, `darkTheme`
- `contrastRatio(foreground: string, background: string): number`
- `type ThemePreference = 'system' | 'light' | 'dark'`, `ThemeProvider({ preference?, children })`, `useTheme(): Theme`
- `makeStyles(factory: (theme: Theme) => T): () => T`
- `useLokkyFonts(): boolean`
- `usePreferencesStore` : `{ themePreference: ThemePreference; setThemePreference(p): void }`
- `renderWithProviders(ui, { preference? })`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`apps/mobile/src/theme/__tests__/themes.test.ts` :
```ts
import { contrastRatio } from '../contrast';
import { darkTheme, lightTheme, type ThemeColors } from '../themes';

type Pair = [foreground: keyof ThemeColors, background: keyof ThemeColors];

// Toutes les combinaisons texte / fond utilisées par le design system.
const TEXT_PAIRS: Pair[] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'surfaceMuted'],
  ['textMuted', 'bg'],
  ['textMuted', 'surface'],
  ['action', 'bg'],
  ['action', 'surface'],
  ['onAction', 'action'],
  ['onAction', 'danger'],
  ['onSecondary', 'secondary'],
  ['onAccent', 'accent'],
  ['secondary', 'bg'],
  ['secondary', 'surface'],
  ['success', 'bg'],
  ['success', 'surface'],
  ['danger', 'bg'],
  ['danger', 'surface'],
  ['warning', 'bg'],
  ['warning', 'surface'],
  ['bg', 'text'], // toasts : texte clair sur fond foncé (inversé en mode sombre)
];

describe.each([
  ['clair', lightTheme],
  ['sombre', darkTheme],
])('thème %s', (_name, theme) => {
  it.each(TEXT_PAIRS)('%s sur %s respecte WCAG AA (≥ 4,5:1)', (fg, bg) => {
    expect(contrastRatio(theme.colors[fg], theme.colors[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('contrastRatio', () => {
  it('vaut 21 pour noir sur blanc et 1 pour une couleur sur elle-même', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FF6B3D', '#FF6B3D')).toBeCloseTo(1, 5);
  });
  it('confirme que l’orange de marque ne peut pas servir de texte sur fond clair', () => {
    expect(contrastRatio('#FF6B3D', lightTheme.colors.bg)).toBeLessThan(4.5);
  });
});
```

`apps/mobile/src/theme/__tests__/ThemeProvider.test.tsx` :
```tsx
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { makeStyles } from '../makeStyles';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { darkTheme, lightTheme } from '../themes';

function Probe() {
  const theme = useTheme();
  return <Text>{theme.scheme}</Text>;
}

const useProbeStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.bg } }));
const seen: object[] = [];
function StyleProbe() {
  const styles = useProbeStyles();
  seen.push(styles);
  return <Text style={styles.box}>style</Text>;
}

describe('ThemeProvider', () => {
  it('applique la préférence explicite', async () => {
    await render(
      <ThemeProvider preference="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('dark')).toBeOnTheScreen();
  });

  it('suit le système par défaut (clair dans Jest)', async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('light')).toBeOnTheScreen();
  });

  it('échoue clairement hors du fournisseur', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow(/ThemeProvider/);
    jest.restoreAllMocks();
  });
});

describe('makeStyles', () => {
  it('réutilise la même feuille de style d’un rendu à l’autre, une par thème', async () => {
    seen.length = 0;
    const { rerender } = await render(
      <ThemeProvider preference="light">
        <StyleProbe />
      </ThemeProvider>,
    );
    await rerender(
      <ThemeProvider preference="light">
        <StyleProbe />
      </ThemeProvider>,
    );
    expect(seen[0]).toBe(seen[1]);
    expect(screen.getByText('style')).toHaveStyle({ backgroundColor: lightTheme.colors.bg });

    await rerender(
      <ThemeProvider preference="dark">
        <StyleProbe />
      </ThemeProvider>,
    );
    expect(screen.getByText('style')).toHaveStyle({ backgroundColor: darkTheme.colors.bg });
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm test -- src/theme` depuis `apps/mobile/`
Attendu : ÉCHEC, modules introuvables.

- [ ] **Étape 3 : écrire le thème**

`apps/mobile/src/theme/tokens.ts` :
```ts
import type { TextStyle } from 'react-native';

// Couleurs brutes de la charte « Chaleur urbaine ». Les composants utilisent les tokens de themes.ts.
export const palette = {
  corniche: '#FF6B3D', // marque : logo, illustrations, décor — jamais du texte sur fond clair
  cornicheDeep: '#C8441C',
  ocean: '#00B4A6',
  oceanDeep: '#007F75',
  oceanLight: '#2DD4BF',
  soleil: '#FFC857',
  sable: '#FAF9F6',
  sableMuted: '#F3F1EC',
  white: '#FFFFFF',
  charbon: '#1F2937',
  charbonLight: '#2A3441',
  nuit: '#141A23',
  ivoire: '#F5F1EA',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  screen: 20,
} as const;

export const radius = { sm: 8, md: 12, lg: 20, full: 999 } as const;

export const fontFamilies = {
  fredokaMedium: 'Fredoka_500Medium',
  fredokaSemiBold: 'Fredoka_600SemiBold',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fontFamilies.fredokaSemiBold, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: fontFamilies.fredokaSemiBold, fontSize: 24, lineHeight: 32 },
  heading: { fontFamily: fontFamilies.fredokaMedium, fontSize: 20, lineHeight: 28 },
  body: { fontFamily: fontFamilies.interRegular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fontFamilies.interSemiBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fontFamilies.interSemiBold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fontFamilies.interMedium, fontSize: 13, lineHeight: 18 },
} as const satisfies Record<string, TextStyle>;

export const motion = { fast: 150, base: 200, slow: 250 } as const;
export const MAX_FONT_SCALE = 1.3;
```

`apps/mobile/src/theme/themes.ts` :
```ts
import { palette, radius, spacing, typography } from './tokens';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  brand: string;
  action: string;
  onAction: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  onAccent: string;
  success: string;
  danger: string;
  warning: string;
  overlay: string;
}

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadow: { card: string | null }; // null : on utilise une bordure à la place
}

export const lightTheme: Theme = {
  scheme: 'light',
  colors: {
    bg: palette.sable,
    surface: palette.white,
    surfaceMuted: palette.sableMuted,
    text: palette.charbon,
    textMuted: '#6B7280',
    border: '#E5E7EB',
    brand: palette.corniche,
    action: palette.cornicheDeep,
    onAction: palette.white,
    secondary: palette.oceanDeep,
    onSecondary: palette.white,
    accent: palette.soleil,
    onAccent: palette.charbon,
    success: '#15803D',
    danger: '#DC2626',
    warning: '#B45309',
    overlay: 'rgba(20, 26, 35, 0.55)',
  },
  spacing,
  radius,
  typography,
  shadow: { card: '0px 2px 10px rgba(31, 41, 55, 0.08)' },
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: {
    bg: palette.nuit,
    surface: palette.charbon,
    surfaceMuted: palette.charbonLight,
    text: palette.ivoire,
    textMuted: '#9CA3AF',
    border: '#2D3748',
    brand: palette.corniche,
    action: palette.corniche,
    onAction: palette.charbon,
    secondary: palette.oceanLight,
    onSecondary: palette.nuit,
    accent: palette.soleil,
    onAccent: palette.charbon,
    success: '#4ADE80',
    danger: '#F87171',
    warning: '#FBBF24',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  spacing,
  radius,
  typography,
  shadow: { card: null },
};
```

`apps/mobile/src/theme/contrast.ts` :
```ts
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Ratio de contraste WCAG 2.x entre deux couleurs #RRGGBB.
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
```

`apps/mobile/src/theme/ThemeProvider.tsx` :
```tsx
import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from './themes';

export type ThemePreference = 'system' | 'light' | 'dark';

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
  preference = 'system',
  children,
}: {
  preference?: ThemePreference;
  children: ReactNode;
}) {
  const system = useColorScheme(); // peut valoir 'unspecified' depuis RN 0.83
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  return (
    <ThemeContext.Provider value={scheme === 'dark' ? darkTheme : lightTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme doit être utilisé à l’intérieur de <ThemeProvider>.');
  return theme;
}
```

`apps/mobile/src/theme/makeStyles.ts` :
```ts
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import { darkTheme, lightTheme, type Theme } from './themes';

// Crée les deux feuilles de style (claire et sombre) une seule fois, au chargement du module.
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  const sheets = {
    light: StyleSheet.create(factory(lightTheme)),
    dark: StyleSheet.create(factory(darkTheme)),
  };
  return function useStyles(): T {
    return sheets[useTheme().scheme];
  };
}
```

`apps/mobile/src/theme/fonts.ts` :
```ts
import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';

// true quand les polices sont prêtes, ou en échec (on continue alors avec les polices système).
export function useLokkyFonts(): boolean {
  const [loaded, error] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  return loaded || error !== null;
}
```

`apps/mobile/src/theme/index.ts` :
```ts
export * from './tokens';
export * from './themes';
export * from './contrast';
export * from './ThemeProvider';
export * from './makeStyles';
export * from './fonts';
```

`apps/mobile/src/state/preferences.ts` :
```ts
import { create } from 'zustand';
import type { ThemePreference } from '@/theme';

interface PreferencesState {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

// Persistance (AsyncStorage) ajoutée au jalon 7, avec l'écran Réglages.
export const usePreferencesStore = create<PreferencesState>()((set) => ({
  themePreference: 'system',
  setThemePreference: (themePreference) => set({ themePreference }),
}));
```

`apps/mobile/src/test/render.tsx` :
```tsx
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider, type ThemePreference } from '@/theme';

export function renderWithProviders(
  ui: ReactElement,
  { preference = 'light' }: { preference?: ThemePreference } = {},
) {
  return render(<ThemeProvider preference={preference}>{ui}</ThemeProvider>);
}
```

- [ ] **Étape 4 : relancer**

Lancer : `npm test -- src/theme` puis `npm run typecheck` et `npm run lint`
Attendu : tout PASSE (40 cas de contraste + les tests du fournisseur). Si une paire échoue, **ajuster la couleur dans `themes.ts`, jamais le seuil du test**.

- [ ] **Point de contrôle (pas de commit).**

---

### Tâche 9 : composants de base, partie 1 (Text, Button, IconButton, Input, TextArea, Chip, Badge)

**Fichiers :**
- Créer : `apps/mobile/src/ui/Text.tsx`, `Button.tsx`, `IconButton.tsx`, `Input.tsx`, `TextArea.tsx`, `Chip.tsx`, `Badge.tsx`, `index.ts`
- Tests : `apps/mobile/src/ui/__tests__/Text.test.tsx`, `Button.test.tsx`, `Input.test.tsx`, `Chip.test.tsx`

**Interfaces consommées :** `useTheme`, `makeStyles`, `MAX_FONT_SCALE`, types `Theme`, `ThemeColors` (tâche 8), `renderWithProviders`.

**Interfaces produites :**
- `Text({ variant?: TextVariant; color?: TextColor; align?; ...TextProps })`, `type TextVariant`, `type TextColor`
- `Button({ label; onPress; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?; disabled?; icon?; fullWidth?; accessibilityHint?; testID? })`
- `IconButton({ icon; accessibilityLabel; onPress; variant?: 'plain' | 'filled'; disabled? })`
- `Input({ label; error?; hint?; disabled?; showCounter?; ref?; ...TextInputProps })`, `TextArea({ maxLength; ...InputProps })`
- `Chip({ label; selected?; onPress; icon? })`
- `Badge({ label; tone: 'free' | 'split' | 'trust' | 'accent' | 'neutral'; icon? })`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`apps/mobile/src/ui/__tests__/Text.test.tsx` :
```tsx
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { darkTheme, lightTheme } from '@/theme';
import { Text } from '../Text';

describe('Text', () => {
  it('applique la variante et la couleur du thème', async () => {
    await renderWithProviders(<Text variant="title">Salut</Text>);
    expect(screen.getByText('Salut')).toHaveStyle({
      fontSize: 24,
      color: lightTheme.colors.text,
    });
  });

  it('suit le mode sombre', async () => {
    await renderWithProviders(<Text color="textMuted">Salut</Text>, { preference: 'dark' });
    expect(screen.getByText('Salut')).toHaveStyle({ color: darkTheme.colors.textMuted });
  });

  it('plafonne l’agrandissement du texte à 1,3×', async () => {
    await renderWithProviders(<Text>Salut</Text>);
    expect(screen.getByText('Salut').props.maxFontSizeMultiplier).toBe(1.3);
  });
});
```

`apps/mobile/src/ui/__tests__/Button.test.tsx` :
```tsx
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { Button } from '../Button';

describe('Button', () => {
  it('déclenche onPress', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Je viens !" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Je viens !' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pendant le chargement : occupé, désactivé et sans texte', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Je viens !" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Je viens !' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(screen.queryByText('Je viens !')).toBeNull();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('désactivé : ne déclenche rien', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Publier" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Publier' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

`apps/mobile/src/ui/__tests__/Input.test.tsx` :
```tsx
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { Input } from '../Input';
import { TextArea } from '../TextArea';

describe('Input', () => {
  it('est accessible par son libellé', async () => {
    await renderWithProviders(<Input label="Prénom" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Prénom')).toBeOnTheScreen();
  });

  it('affiche l’erreur à la place de l’aide', async () => {
    await renderWithProviders(
      <Input label="Prénom" value="A" hint="Visible par tous" error="Trop court" />,
    );
    expect(screen.getByText('Trop court')).toBeOnTheScreen();
    expect(screen.queryByText('Visible par tous')).toBeNull();
  });
});

describe('TextArea', () => {
  it('affiche le compteur de caractères', async () => {
    await renderWithProviders(<TextArea label="Description" value="Salut la team" maxLength={500} />);
    expect(screen.getByText('13/500')).toBeOnTheScreen();
  });
});
```

`apps/mobile/src/ui/__tests__/Chip.test.tsx` :
```tsx
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { Badge } from '../Badge';
import { Chip } from '../Chip';

describe('Chip', () => {
  it('expose son état sélectionné et réagit à l’appui', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Chip label="Ce soir" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Ce soir' });
    expect(chip).toBeSelected();
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Badge', () => {
  it('affiche son libellé', async () => {
    await renderWithProviders(<Badge label="Gratuit" tone="free" />);
    expect(screen.getByText('Gratuit')).toBeOnTheScreen();
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm test -- src/ui` depuis `apps/mobile/`
Attendu : ÉCHEC, modules introuvables.

- [ ] **Étape 3 : écrire les composants**

`apps/mobile/src/ui/Text.tsx` :
```tsx
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { MAX_FONT_SCALE, useTheme, type Theme, type ThemeColors } from '@/theme';

export type TextVariant = keyof Theme['typography'];
// Couleurs autorisées pour du texte : brand et les couleurs de fond en sont exclues.
export type TextColor = Exclude<
  keyof ThemeColors,
  'brand' | 'bg' | 'surface' | 'surfaceMuted' | 'border' | 'overlay' | 'accent'
>;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
```

`apps/mobile/src/ui/Button.tsx` :
```tsx
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const foreground = variant === 'primary' || variant === 'danger' ? colors.onAction : colors.action;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon}
          <Text variant="label" style={{ color: foreground }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sm: { minHeight: 44, paddingHorizontal: t.spacing.md },
  md: { minHeight: 48, paddingHorizontal: t.spacing.lg },
  lg: { minHeight: 56, paddingHorizontal: t.spacing.xl },
  primary: { backgroundColor: t.colors.action },
  secondary: { borderColor: t.colors.action },
  ghost: {},
  danger: { backgroundColor: t.colors.danger },
  fullWidth: { alignSelf: 'stretch' },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
}));
```

`apps/mobile/src/ui/IconButton.tsx` :
```tsx
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { makeStyles } from '@/theme';

export interface IconButtonProps {
  icon: ReactNode;
  accessibilityLabel: string; // obligatoire : un bouton-icône n'a pas de texte visible
  onPress: () => void;
  variant?: 'plain' | 'filled';
  disabled?: boolean;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  disabled = false,
}: IconButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'filled' && styles.filled,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    width: 44,
    height: 44,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: t.colors.surfaceMuted },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
}));
```

`apps/mobile/src/ui/Input.tsx` :
```tsx
import { useState, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { MAX_FONT_SCALE, makeStyles, useTheme } from '@/theme';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style' | 'editable'> {
  label: string;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
  showCounter?: boolean;
  ref?: Ref<TextInput>;
}

export function Input({
  label,
  error,
  hint,
  disabled = false,
  showCounter = false,
  multiline,
  maxLength,
  value,
  onFocus,
  onBlur,
  ref,
  ...rest
}: InputProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <TextInput
        {...rest}
        ref={ref}
        accessibilityLabel={label}
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        editable={!disabled}
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error ? styles.error : null,
          disabled && styles.disabled,
        ]}
      />
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      ) : null}
      {showCounter && maxLength ? (
        <Text variant="caption" color="textMuted" align="right">
          {`${value?.length ?? 0}/${maxLength}`}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { gap: t.spacing.xs },
  input: {
    minHeight: 48,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.lg,
    color: t.colors.text,
    fontFamily: t.typography.body.fontFamily,
    fontSize: t.typography.body.fontSize,
  },
  multiline: { minHeight: 120, paddingTop: t.spacing.md, textAlignVertical: 'top' },
  focused: { borderColor: t.colors.action },
  error: { borderColor: t.colors.danger },
  disabled: { opacity: 0.5 },
}));
```

`apps/mobile/src/ui/TextArea.tsx` :
```tsx
import { Input, type InputProps } from './Input';

export type TextAreaProps = Omit<InputProps, 'multiline' | 'showCounter'> & { maxLength: number };

export function TextArea(props: TextAreaProps) {
  return <Input {...props} multiline showCounter />;
}
```

`apps/mobile/src/ui/Chip.tsx` :
```tsx
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { makeStyles } from '@/theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {icon}
      <Text variant="label" color={selected ? 'onAction' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  chip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  selected: { backgroundColor: t.colors.action, borderColor: t.colors.action },
  pressed: { opacity: 0.8 },
}));
```

`apps/mobile/src/ui/Badge.tsx` :
```tsx
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { Text, type TextColor } from './Text';

export type BadgeTone = 'free' | 'split' | 'trust' | 'accent' | 'neutral';

const TEXT_COLOR: Record<BadgeTone, TextColor> = {
  free: 'onSecondary',
  split: 'text',
  trust: 'success',
  accent: 'onAccent',
  neutral: 'text',
};

export function Badge({ label, tone, icon }: { label: string; tone: BadgeTone; icon?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={[styles.base, styles[tone]]}>
      {icon}
      <Text variant="caption" color={TEXT_COLOR[tone]}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: 2,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  free: { backgroundColor: t.colors.secondary },
  split: { backgroundColor: t.colors.surfaceMuted },
  trust: { backgroundColor: t.colors.surface, borderColor: t.colors.success },
  accent: { backgroundColor: t.colors.accent },
  neutral: { backgroundColor: t.colors.surfaceMuted },
}));
```

`apps/mobile/src/ui/index.ts` (complété aux tâches 10 et 11) :
```ts
export * from './Text';
export * from './Button';
export * from './IconButton';
export * from './Input';
export * from './TextArea';
export * from './Chip';
export * from './Badge';
```

- [ ] **Étape 4 : relancer**

Lancer : `npm test -- src/ui` puis `npm run typecheck` et `npm run lint`
Attendu : tout PASSE. Le lint confirme qu'aucun fichier de `ui/` n'importe `features/`, `api/` ou `state/`.

- [ ] **Point de contrôle (pas de commit).**

---
### Tâche 10 : composants de base, partie 2 (Avatar, AvatarStack, Card, Divider, Skeleton, EmptyState, ScreenHeader, Stepper)

**Fichiers :**
- Créer : `apps/mobile/src/ui/Avatar.tsx`, `AvatarStack.tsx`, `Card.tsx`, `Divider.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `ScreenHeader.tsx`, `Stepper.tsx`
- Modifier : `apps/mobile/src/ui/index.ts`
- Tests : `apps/mobile/src/ui/__tests__/Avatar.test.tsx`, `Layout.test.tsx`

**Interfaces consommées :** `Text`, `Button`, `IconButton` (tâche 9), `makeStyles`, `useTheme`, `contrastRatio`, `motion` (tâche 8).

**Interfaces produites :**
- `Avatar({ name; uri: string | null; size?: AvatarSize })`, `type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'`, `AVATAR_SIZES`, `AVATAR_TONES`, `avatarTone(name)`, `initials(name)`
- `AvatarStack({ people: StackPerson[]; total?; max?; size? })`, `type StackPerson = { id: string; name: string; uri: string | null }`
- `Card({ children; onPress?; accessibilityLabel?; style? })`, `Divider()`
- `Skeleton({ width?; height; radius? })`
- `EmptyState({ title; description?; illustration?; action?: { label; onPress } })`
- `ScreenHeader({ title; onBack?; right? })`
- `Stepper({ step; total })`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`apps/mobile/src/ui/__tests__/Avatar.test.tsx` :
```tsx
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { contrastRatio } from '@/theme';
import { AVATAR_TONES, Avatar, avatarTone, initials } from '../Avatar';
import { AvatarStack } from '../AvatarStack';

const people = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `u${i}`, name: `Personne ${i}`, uri: null }));

describe('Avatar', () => {
  it('affiche l’initiale quand il n’y a pas de photo', async () => {
    await renderWithProviders(<Avatar name="awa" uri={null} />);
    expect(screen.getByText('A')).toBeOnTheScreen();
    expect(screen.getByLabelText('awa')).toBeOnTheScreen();
  });

  it('affiche la photo quand elle existe', async () => {
    await renderWithProviders(<Avatar name="Awa" uri="https://exemple.sn/awa.jpg" />);
    expect(screen.getByTestId('avatar-image')).toBeOnTheScreen();
  });

  it('gère un prénom vide', () => {
    expect(initials('   ')).toBe('?');
  });

  it('donne toujours la même couleur au même prénom', () => {
    expect(avatarTone('Moussa')).toBe(avatarTone('Moussa'));
  });

  it.each(AVATAR_TONES.map((t) => [t.fg, t.bg]))('initiale %s sur %s lisible', (fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('AvatarStack', () => {
  it('limite les avatars affichés et indique le reste', async () => {
    await renderWithProviders(<AvatarStack people={people(7)} max={4} />);
    expect(screen.getByText('+3')).toBeOnTheScreen();
    expect(screen.getByLabelText('7 participants')).toBeOnTheScreen();
  });

  it('calcule le reste à partir du total réel, pas de l’aperçu', async () => {
    await renderWithProviders(<AvatarStack people={people(5)} total={12} max={4} />);
    expect(screen.getByText('+8')).toBeOnTheScreen();
  });

  it('n’affiche pas de reste quand tout le monde tient', async () => {
    await renderWithProviders(<AvatarStack people={people(1)} />);
    expect(screen.queryByText(/^\+/)).toBeNull();
    expect(screen.getByLabelText('1 participant')).toBeOnTheScreen();
  });
});
```

`apps/mobile/src/ui/__tests__/Layout.test.tsx` :
```tsx
import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithProviders } from '@/test/render';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { ScreenHeader } from '../ScreenHeader';
import { Skeleton } from '../Skeleton';
import { Stepper } from '../Stepper';

describe('Card', () => {
  it('devient un bouton quand elle est cliquable', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Card onPress={onPress} accessibilityLabel="Foot à la plage">
        <Text>contenu</Text>
      </Card>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Foot à la plage' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('affiche le message et déclenche l’action', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <EmptyState
        title="Aucune activité ce soir…"
        description="et si tu en créais une ?"
        action={{ label: 'Créer une activité', onPress }}
      />,
    );
    expect(screen.getByText('Aucune activité ce soir…')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Créer une activité' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ScreenHeader', () => {
  it('affiche un titre et un bouton retour accessible', async () => {
    const onBack = jest.fn();
    await renderWithProviders(<ScreenHeader title="Détail" onBack={onBack} />);
    expect(screen.getByRole('header', { name: 'Détail' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('Stepper', () => {
  it('annonce l’étape courante', async () => {
    await renderWithProviders(<Stepper step={2} total={5} />);
    expect(screen.getByLabelText('Étape 2 sur 5')).toBeOnTheScreen();
  });
  it('borne une étape hors limites', async () => {
    await renderWithProviders(<Stepper step={9} total={5} />);
    expect(screen.getByLabelText('Étape 5 sur 5')).toBeOnTheScreen();
  });
});

describe('Skeleton', () => {
  it('est masqué aux lecteurs d’écran', async () => {
    await renderWithProviders(<Skeleton height={20} />);
    expect(screen.getByTestId('skeleton', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('skeleton')).toBeNull();
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm test -- src/ui` depuis `apps/mobile/`
Attendu : ÉCHEC sur les nouveaux fichiers, modules introuvables.

- [ ] **Étape 3 : écrire les composants**

`apps/mobile/src/ui/Avatar.tsx` :
```tsx
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

export const AVATAR_SIZES = { sm: 28, md: 40, lg: 56, xl: 96 } as const;
export type AvatarSize = keyof typeof AVATAR_SIZES;

// Couleurs de marque fixes (identiques en clair et en sombre), contraste vérifié par les tests.
export const AVATAR_TONES = [
  { bg: '#FFE1D6', fg: '#8A2E12' },
  { bg: '#D5F2EF', fg: '#035E57' },
  { bg: '#FFF0C9', fg: '#6B4700' },
  { bg: '#E5E7EB', fg: '#1F2937' },
] as const;

export function avatarTone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? AVATAR_TONES[0];
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function Avatar({
  name,
  uri,
  size = 'md',
}: {
  name: string;
  uri: string | null;
  size?: AvatarSize;
}) {
  const d = AVATAR_SIZES[size];
  const frame = { width: d, height: d, borderRadius: d / 2 };

  if (uri) {
    return (
      <Image
        testID="avatar-image"
        source={{ uri }}
        style={frame}
        contentFit="cover"
        transition={150}
        accessible
        accessibilityLabel={name}
      />
    );
  }
  const tone = avatarTone(name);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[frame, styles.center, { backgroundColor: tone.bg }]}
    >
      <Text
        variant="label"
        maxFontSizeMultiplier={1}
        style={{ color: tone.fg, fontSize: d * 0.42, lineHeight: d * 0.52 }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
```

`apps/mobile/src/ui/AvatarStack.tsx` :
```tsx
import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { AVATAR_SIZES, Avatar, type AvatarSize } from './Avatar';
import { Text } from './Text';

export type StackPerson = { id: string; name: string; uri: string | null };

export function AvatarStack({
  people,
  total = people.length,
  max = 4,
  size = 'sm',
}: {
  people: StackPerson[];
  total?: number;
  max?: number;
  size?: AvatarSize;
}) {
  const styles = useStyles();
  const shown = people.slice(0, max);
  const overflow = Math.max(0, total - shown.length);
  const d = AVATAR_SIZES[size];

  return (
    <View
      accessible
      accessibilityLabel={`${total} participant${total > 1 ? 's' : ''}`}
      style={styles.row}
    >
      {shown.map((person, index) => (
        <View key={person.id} style={[styles.ring, index > 0 && { marginLeft: -d / 3 }]}>
          <Avatar name={person.name} uri={person.uri} size={size} />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={[
            styles.ring,
            styles.more,
            { width: d, height: d, borderRadius: d / 2, marginLeft: -d / 3 },
          ]}
        >
          <Text variant="caption" maxFontSizeMultiplier={1}>{`+${overflow}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: { borderWidth: 2, borderColor: t.colors.surface, borderRadius: t.radius.full },
  more: { backgroundColor: t.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
}));
```

`apps/mobile/src/ui/Card.tsx` :
```tsx
import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '@/theme';

export function Card({
  children,
  onPress,
  accessibilityLabel,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
    ...(t.shadow.card
      ? { boxShadow: t.shadow.card }
      : { borderWidth: 1, borderColor: t.colors.border }),
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
}));
```

`apps/mobile/src/ui/Divider.tsx` :
```tsx
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}
```

`apps/mobile/src/ui/Skeleton.tsx` :
```tsx
import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

export function Skeleton({
  width = '100%',
  height,
  radius,
}: {
  width?: DimensionValue;
  height: number;
  radius?: number;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.set(withRepeat(withTiming(0.5, { duration: 700 }), -1, true));
    return () => cancelAnimation(opacity);
  }, [reduceMotion, opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      testID="skeleton"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.surfaceMuted,
        },
        pulse,
      ]}
    />
  );
}
```

`apps/mobile/src/ui/EmptyState.tsx` :
```tsx
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export function EmptyState({
  title,
  description,
  illustration,
  action,
}: {
  title: string;
  description?: string;
  illustration?: ReactNode;
  action?: { label: string; onPress: () => void };
}) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      {illustration}
      <Text variant="heading" align="center">
        {title}
      </Text>
      {description ? (
        <Text color="textMuted" align="center">
          {description}
        </Text>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
    padding: t.spacing.xxl,
  },
}));
```

`apps/mobile/src/ui/ScreenHeader.tsx` :
```tsx
import { ArrowLeft } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton
            accessibilityLabel="Retour"
            onPress={onBack}
            icon={<ArrowLeft size={24} color={colors.text} weight="bold" />}
          />
        ) : null}
      </View>
      <Text variant="heading" accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing.sm,
  },
  side: { width: 48 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
}));
```

`apps/mobile/src/ui/Stepper.tsx` :
```tsx
import { View } from 'react-native';
import { makeStyles } from '@/theme';

export function Stepper({ step, total }: { step: number; total: number }) {
  const styles = useStyles();
  const safeTotal = Math.max(1, Math.floor(total));
  const current = Math.min(Math.max(1, Math.floor(step)), safeTotal);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Étape ${current} sur ${safeTotal}`}
      accessibilityValue={{ min: 1, max: safeTotal, now: current }}
      style={styles.row}
    >
      {Array.from({ length: safeTotal }, (_, i) => (
        <View key={i} style={[styles.segment, i < current && styles.done]} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: t.colors.border },
  done: { backgroundColor: t.colors.action },
}));
```

Ajouter à `apps/mobile/src/ui/index.ts` :
```ts
export * from './Avatar';
export * from './AvatarStack';
export * from './Card';
export * from './Divider';
export * from './Skeleton';
export * from './EmptyState';
export * from './ScreenHeader';
export * from './Stepper';
```

- [ ] **Étape 4 : relancer**

Lancer : `npm test -- src/ui` puis `npm run typecheck` et `npm run lint`
Attendu : tout PASSE. Si le lint (règles React Compiler) signale `opacity.set` dans `Skeleton`, c'est la forme recommandée par Reanimated 4 : vérifier que `.value =` n'a pas été utilisé à la place.

- [ ] **Point de contrôle (pas de commit).**

---

### Tâche 11 : Sheet, Toast et logo

**Fichiers :**
- Créer : `apps/mobile/src/ui/Sheet.tsx`, `Toast.tsx`, `LokkyLogo.tsx`
- Modifier : `apps/mobile/src/ui/index.ts`, `apps/mobile/src/test/render.tsx` (ajout du `ToastProvider`)
- Tests : `apps/mobile/src/ui/__tests__/Overlay.test.tsx`, `LokkyLogo.test.tsx`

**Interfaces consommées :** `Text` (tâche 9), `makeStyles`, `useTheme`, `palette`, `motion`, `spacing` (tâche 8).

**Interfaces produites :**
- `Sheet({ visible; onClose; title?; children })`
- `ToastProvider({ children; durationMs? = 3500 })`, `useToast(): { show(message: string, tone?: 'info' | 'success' | 'error'): void }`
- `LokkyLogo({ variant?: 'full' | 'symbol' | 'mono'; size?: number; color?: string; simplified?: boolean })`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

`apps/mobile/src/ui/__tests__/Overlay.test.tsx` :
```tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithProviders } from '@/test/render';
import { Sheet } from '../Sheet';
import { useToast } from '../Toast';

describe('Sheet', () => {
  it('affiche son contenu et se ferme en touchant le fond', async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <Sheet visible onClose={onClose} title="Signaler">
        <Text>Choisis un motif</Text>
      </Sheet>,
    );
    expect(screen.getByRole('header', { name: 'Signaler' })).toBeOnTheScreen();
    expect(screen.getByText('Choisis un motif')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('ne rend rien quand elle est fermée', async () => {
    await renderWithProviders(
      <Sheet visible={false} onClose={() => {}}>
        <Text>caché</Text>
      </Sheet>,
    );
    expect(screen.queryByText('caché')).toBeNull();
  });
});

function ToastTrigger() {
  const toast = useToast();
  return (
    <Text accessibilityRole="button" onPress={() => toast.show('Activité complète', 'error')}>
      déclencher
    </Text>
  );
}

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('affiche un message puis le retire après 3,5 s', async () => {
    await renderWithProviders(<ToastTrigger />);
    await fireEvent.press(screen.getByText('déclencher'));
    expect(screen.getByRole('alert')).toHaveTextContent('Activité complète');
    await act(async () => {
      jest.advanceTimersByTime(3500);
    });
    expect(screen.queryByText('Activité complète')).toBeNull();
  });

  it('échoue clairement hors du fournisseur', async () => {
    function Orphan() {
      useToast();
      return null;
    }
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Orphan />)).rejects.toThrow(/ToastProvider/);
    jest.restoreAllMocks();
  });
});
```

`apps/mobile/src/ui/__tests__/LokkyLogo.test.tsx` :
```tsx
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { LokkyLogo } from '../LokkyLogo';

describe('LokkyLogo', () => {
  it('version complète : symbole + nom, annoncée « Lokky »', async () => {
    await renderWithProviders(<LokkyLogo />);
    expect(screen.getByLabelText('Lokky')).toBeOnTheScreen();
    expect(screen.getByText('Lokky')).toBeOnTheScreen();
  });

  it('version symbole seule : pas de nom écrit', async () => {
    await renderWithProviders(<LokkyLogo variant="symbol" />);
    expect(screen.queryByText('Lokky')).toBeNull();
  });

  it('version simplifiée : sans les personnages', async () => {
    await renderWithProviders(<LokkyLogo variant="symbol" simplified />);
    expect(screen.queryByTestId('logo-people', { includeHiddenElements: true })).toBeNull();
  });

  it('version complète : avec les personnages', async () => {
    await renderWithProviders(<LokkyLogo variant="symbol" />);
    expect(screen.getByTestId('logo-people', { includeHiddenElements: true })).toBeTruthy();
  });
});
```

- [ ] **Étape 2 : lancer les tests**

Lancer : `npm test -- src/ui` depuis `apps/mobile/`
Attendu : ÉCHEC, modules introuvables.

- [ ] **Étape 3 : écrire les composants**

`apps/mobile/src/ui/Sheet.tsx` :
```tsx
import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '@/theme';
import { Text } from './Text';

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          {title ? (
            <Text variant="heading" accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: t.colors.overlay,
  },
  sheet: {
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.lg,
    borderTopRightRadius: t.radius.lg,
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.md,
    gap: t.spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.border,
  },
}));
```

`apps/mobile/src/ui/Toast.tsx` :
```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, motion, spacing } from '@/theme';
import { Text } from './Text';

export type ToastTone = 'info' | 'success' | 'error';
interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({
  children,
  durationMs = 3500,
}: {
  children: ReactNode;
  durationMs?: number;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const nextId = useRef(0);
  const [toast, setToast] = useState<{ id: number; message: string; tone: ToastTone } | null>(
    null,
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), durationMs);
    return () => clearTimeout(timer);
  }, [toast, durationMs]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
  }, []);
  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(motion.base)}
          exiting={FadeOutUp.duration(motion.fast)}
          pointerEvents="box-none"
          style={[styles.container, { top: insets.top + spacing.sm }]}
        >
          <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.toast}>
            <View style={[styles.bar, styles[toast.tone]]} />
            <Text variant="bodyStrong" style={styles.message}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast doit être utilisé à l’intérieur de <ToastProvider>.');
  return api;
}

const useStyles = makeStyles((t) => ({
  container: { position: 'absolute', left: t.spacing.screen, right: t.spacing.screen, zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    backgroundColor: t.colors.text, // fond inversé : sombre en clair, clair en sombre
    borderRadius: t.radius.md,
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
  },
  message: { flex: 1, color: t.colors.bg },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  info: { backgroundColor: t.colors.brand },
  success: { backgroundColor: t.colors.success },
  error: { backgroundColor: t.colors.danger },
}));
```

`apps/mobile/src/ui/LokkyLogo.tsx` :
```tsx
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';
import { palette, useTheme } from '@/theme';
import { Text } from './Text';

// Symbole « Coucher de Corniche » simplifié (spec §3) : demi-soleil, trois silhouettes
// découpées dans le soleil (masque), une seule vague épaisse. viewBox 64 × 64.
const SUN = 'M8 38 A24 24 0 0 1 56 38 Z';
const WAVE = 'M8 47 C 16 41.5, 24 41.5, 32 47 S 48 52.5, 56 47';
const HEADS = [
  { cx: 18.5, cy: 27, r: 3.2 },
  { cx: 32, cy: 25, r: 3.8 },
  { cx: 45.5, cy: 27, r: 3.2 },
];
const SHOULDERS = [
  'M13.5 38 A5 5 0 0 1 23.5 38 Z',
  'M26 38 A6 6 0 0 1 38 38 Z',
  'M40.5 38 A5 5 0 0 1 50.5 38 Z',
];

export type LogoVariant = 'full' | 'symbol' | 'mono';

export function LokkyLogo({
  variant = 'full',
  size = 40,
  color,
  simplified = false,
}: {
  variant?: LogoVariant;
  size?: number;
  color?: string;
  simplified?: boolean; // très petites tailles : soleil + vague, sans personnages
}) {
  const theme = useTheme();
  const maskId = `lokky-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const mono = variant === 'mono';
  const sunColor = mono ? (color ?? theme.colors.text) : palette.corniche;
  const waveColor = mono ? sunColor : palette.ocean;
  const standalone = variant !== 'full';

  const symbol = (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessible={standalone}
      accessibilityLabel={standalone ? 'Lokky' : undefined}
    >
      <Defs>
        <Mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <Rect width="64" height="64" fill="#FFFFFF" />
          {simplified ? null : (
            <G testID="logo-people" fill="#000000">
              {HEADS.map((h) => (
                <Circle key={`${h.cx}`} cx={h.cx} cy={h.cy} r={h.r} />
              ))}
              {SHOULDERS.map((d) => (
                <Path key={d} d={d} />
              ))}
            </G>
          )}
        </Mask>
      </Defs>
      <Path d={SUN} fill={sunColor} mask={`url(#${maskId})`} />
      <Path d={WAVE} stroke={waveColor} strokeWidth={5} strokeLinecap="round" fill="none" />
    </Svg>
  );

  if (standalone) return symbol;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Lokky"
      style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.15 }}
    >
      {symbol}
      <Text
        variant="display"
        maxFontSizeMultiplier={1}
        style={{ fontSize: size * 0.8, lineHeight: size }}
      >
        Lokky
      </Text>
    </View>
  );
}
```

Ajouter à `apps/mobile/src/ui/index.ts` :
```ts
export * from './Sheet';
export * from './Toast';
export * from './LokkyLogo';
```

Remplacer `apps/mobile/src/test/render.tsx` :
```tsx
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider, type ThemePreference } from '@/theme';
import { ToastProvider } from '@/ui/Toast';

export function renderWithProviders(
  ui: ReactElement,
  { preference = 'light' }: { preference?: ThemePreference } = {},
) {
  return render(
    <ThemeProvider preference={preference}>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
  );
}
```

- [ ] **Étape 4 : relancer**

Lancer : `npm test` (toute l'app) puis `npm run typecheck` et `npm run lint`
Attendu : tout PASSE. Si `screen.getByLabelText('Lokky')` trouve deux éléments dans le test « version complète », retirer `accessibilityLabel` du `Svg` quand `variant === 'full'` (c'est déjà le cas dans le code ci-dessus : vérifier la condition `standalone`).

- [ ] **Point de contrôle (pas de commit).**

---
### Tâche 12 : racine de l'app, accueil provisoire et vitrine `/dev/ui`

**Fichiers :**
- Remplacer : `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`
- Créer : `apps/mobile/app/dev/ui.tsx`
- Créer : `apps/mobile/src/features/dev/screens/HomePlaceholderScreen.tsx`, `DesignSystemScreen.tsx`
- Supprimer : `apps/mobile/src/__tests__/smoke.test.tsx` (remplacé par le test ci-dessous)
- Test : `apps/mobile/src/features/dev/__tests__/DesignSystemScreen.test.tsx`

**Interfaces consommées :** tout `@/ui`, `@/theme`, `usePreferencesStore` (`@/state/preferences`), `createQueryClient`, `setupFocusManager` (tâche 6), `formatActivityWhen`, `formatCost` (tâche 5).

**Interfaces produites :** `HomePlaceholderScreen()`, `DesignSystemScreen()` ; route `/dev/ui` disponible uniquement si `__DEV__`.

- [ ] **Étape 1 : écrire le test (il doit échouer)**

`apps/mobile/src/features/dev/__tests__/DesignSystemScreen.test.tsx` :
```tsx
import { fireEvent, screen } from '@testing-library/react-native';
import { usePreferencesStore } from '@/state/preferences';
import { renderWithProviders } from '@/test/render';
import { DesignSystemScreen } from '../screens/DesignSystemScreen';

describe('DesignSystemScreen', () => {
  beforeEach(() => usePreferencesStore.setState({ themePreference: 'system' }));

  it('présente chaque famille de composants', async () => {
    await renderWithProviders(<DesignSystemScreen />);
    for (const section of ['Logo', 'Couleurs', 'Typographie', 'Boutons', 'Champs', 'Puces et badges', 'Avatars', 'États']) {
      expect(screen.getByRole('header', { name: section })).toBeOnTheScreen();
    }
  });

  it('change la préférence de thème', async () => {
    await renderWithProviders(<DesignSystemScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sombre' }));
    expect(usePreferencesStore.getState().themePreference).toBe('dark');
  });

  it('ouvre la feuille du bas', async () => {
    await renderWithProviders(<DesignSystemScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Ouvrir une feuille' }));
    expect(screen.getByRole('header', { name: 'Signaler' })).toBeOnTheScreen();
  });
});
```

- [ ] **Étape 2 : lancer le test**

Lancer : `npm test -- src/features/dev` depuis `apps/mobile/`
Attendu : ÉCHEC, module introuvable.

- [ ] **Étape 3 : écrire les écrans**

`apps/mobile/src/features/dev/screens/DesignSystemScreen.tsx` :
```tsx
import { Heart, Moon } from 'phosphor-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatActivityWhen, formatCost } from '@/lib';
import { usePreferencesStore } from '@/state/preferences';
import { makeStyles, useTheme, type ThemePreference } from '@/theme';
import {
  AvatarStack,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  IconButton,
  Input,
  LokkyLogo,
  ScreenHeader,
  Sheet,
  Skeleton,
  Stepper,
  Text,
  TextArea,
  useToast,
  type ButtonVariant,
  type TextVariant,
} from '@/ui';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Système' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
];
const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const TYPE_SCALE: TextVariant[] = ['display', 'title', 'heading', 'body', 'bodyStrong', 'label', 'caption'];
const FILTERS = ['Ce soir', 'Ce week-end', 'Gratuit', 'Sport', 'Chill'];
const PEOPLE = ['Awa', 'Moussa', 'Fatou', 'Cheikh', 'Mariama', 'Ousmane'].map((name) => ({
  id: name,
  name,
  uri: null,
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function DesignSystemScreen() {
  const styles = useStyles();
  const theme = useTheme();
  const toast = useToast();
  const { themePreference, setThemePreference } = usePreferencesStore();
  const [filter, setFilter] = useState('Ce soir');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const now = new Date();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Design system" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          {THEMES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={themePreference === t.value}
              onPress={() => setThemePreference(t.value)}
            />
          ))}
        </View>

        <Section title="Logo">
          <LokkyLogo size={48} />
          <View style={styles.row}>
            <LokkyLogo variant="symbol" size={64} />
            <LokkyLogo variant="mono" size={48} />
            <LokkyLogo variant="symbol" size={48} />
            <LokkyLogo variant="symbol" size={24} simplified />
          </View>
        </Section>

        <Section title="Couleurs">
          <View style={styles.swatches}>
            {Object.entries(theme.colors).map(([name, value]) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.swatchColor, { backgroundColor: value }]} />
                <Text variant="caption" color="textMuted">
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Typographie">
          {TYPE_SCALE.map((variant) => (
            <Text key={variant} variant={variant}>
              {`${variant} · Tu fais quoi ce soir ?`}
            </Text>
          ))}
        </Section>

        <Section title="Boutons">
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} label={`Je viens ! (${variant})`} onPress={() => toast.show(variant)} />
          ))}
          <Button label="Chargement" loading onPress={() => {}} />
          <Button label="Désactivé" disabled onPress={() => {}} />
          <View style={styles.row}>
            <IconButton accessibilityLabel="J’aime" onPress={() => {}} icon={<Heart size={24} color={theme.colors.text} weight="fill" />} />
            <IconButton accessibilityLabel="Mode sombre" variant="filled" onPress={() => setThemePreference('dark')} icon={<Moon size={24} color={theme.colors.text} weight="fill" />} />
          </View>
        </Section>

        <Section title="Champs">
          <Input label="Titre de l’activité" placeholder="Foot à la plage" value={title} onChangeText={setTitle} />
          <Input label="Prénom" value="A" error="Ton prénom doit faire au moins 2 caractères." onChangeText={() => {}} />
          <TextArea label="Description" value={description} onChangeText={setDescription} maxLength={500} />
          <Stepper step={2} total={5} />
        </Section>

        <Section title="Puces et badges">
          <View style={styles.row}>
            {FILTERS.map((label) => (
              <Chip key={label} label={label} selected={filter === label} onPress={() => setFilter(label)} />
            ))}
          </View>
          <View style={styles.row}>
            <Badge tone="free" label={formatCost({ type: 'free' })} />
            <Badge tone="split" label={formatCost({ type: 'split', estimateFcfa: 3000 })} />
            <Badge tone="trust" label="Créateur fiable" />
            <Badge tone="accent" label="Ce soir" />
          </View>
        </Section>

        <Section title="Avatars">
          <AvatarStack people={PEOPLE} total={9} max={4} />
          <AvatarStack people={PEOPLE} max={4} size="md" />
          <Card onPress={() => toast.show('Carte touchée', 'success')} accessibilityLabel="Foot à la plage">
            <Text variant="bodyStrong">Foot à la plage</Text>
            <Text color="textMuted">{formatActivityWhen(new Date(now.getTime() + 3 * 3_600_000), now)}</Text>
            <AvatarStack people={PEOPLE.slice(0, 3)} total={6} />
          </Card>
        </Section>

        <Section title="États">
          <Skeleton height={20} />
          <Skeleton height={80} radius={theme.radius.lg} />
          <Divider />
          <EmptyState
            title="Aucune activité ce soir…"
            description="et si tu en créais une ?"
            action={{ label: 'Créer une activité', onPress: () => toast.show('Nanu dem !', 'success') }}
          />
          <Button variant="secondary" label="Afficher un toast d’erreur" onPress={() => toast.show('Activité complète', 'error')} />
          <Button variant="secondary" label="Ouvrir une feuille" onPress={() => setSheetOpen(true)} />
        </Section>
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Signaler">
        <Text color="textMuted">Exemple de feuille du bas.</Text>
        <Button label="Fermer" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.screen, gap: t.spacing.xxxl, paddingBottom: t.spacing.huge },
  section: { gap: t.spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.spacing.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
  swatch: { width: 72, gap: t.spacing.xs },
  swatchColor: {
    height: 48,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
}));
```
> Prettier reformatera les lignes longues. Ce fichier dépasse un peu la limite indicative de 250 lignes une fois formaté : c'est acceptable pour un écran de démonstration réservé au développement. Il n'est pas inclus dans les builds de production (route protégée).

Créer `apps/mobile/src/lib/index.ts` (utilisé ci-dessus) :
```ts
export * from './dates';
export * from './format';
```
> `env` n'est volontairement pas réexporté : il s'importe explicitement depuis `@/lib/env`.

`apps/mobile/src/features/dev/screens/HomePlaceholderScreen.tsx` :
```tsx
import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from '@/theme';
import { Button, LokkyLogo, Text } from '@/ui';

// Accueil provisoire du jalon 1, remplacé par l'écran Bienvenue au jalon 2.
export function HomePlaceholderScreen() {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <LokkyLogo size={56} />
        <Text variant="title" align="center">
          Tu fais quoi ce soir ?
        </Text>
        <Text color="textMuted" align="center">
          La nouvelle version de Lokky se construit ici.
        </Text>
        {__DEV__ ? (
          <Button label="Voir le design system" onPress={() => router.push('/dev/ui')} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.lg,
    padding: t.spacing.screen,
  },
}));
```

- [ ] **Étape 4 : écrire les routes**

`apps/mobile/app/_layout.tsx` :
```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createQueryClient, setupFocusManager } from '@/api/queryClient';
import { usePreferencesStore } from '@/state/preferences';
import { ThemeProvider, useLokkyFonts, useTheme } from '@/theme';
import { ToastProvider } from '@/ui';

SplashScreen.preventAutoHideAsync();
const queryClient = createQueryClient();

function ThemedStack() {
  const theme = useTheme();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.bg);
  }, [theme]);
  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}
      />
    </>
  );
}

export default function RootLayout() {
  const fontsReady = useLokkyFonts();
  const themePreference = usePreferencesStore((s) => s.themePreference);

  useEffect(() => setupFocusManager(), []);
  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider preference={themePreference}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ThemedStack />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

`apps/mobile/app/index.tsx` :
```tsx
export { HomePlaceholderScreen as default } from '@/features/dev/screens/HomePlaceholderScreen';
```

`apps/mobile/app/dev/ui.tsx` :
```tsx
import { Redirect } from 'expo-router';
import { DesignSystemScreen } from '@/features/dev/screens/DesignSystemScreen';

export default function DevUiRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DesignSystemScreen />;
}
```

Supprimer `apps/mobile/src/__tests__/smoke.test.tsx` : il importait l'ancien `app/index.tsx`. La lecture du package partagé et le fuseau de test sont désormais couverts par les tests de `lib/` et du client simulé.

- [ ] **Étape 5 : relancer toute la suite**

Lancer depuis `apps/mobile/` : `npm test`, `npm run typecheck`, `npm run lint`, `npx expo-doctor`
Attendu : tout PASSE.

- [ ] **Étape 6 : vérifier sur un appareil (étape manuelle)**

1. Créer un build de développement : `eas build --profile development --platform android` (ou `npx expo run:android` / `npx expo run:ios` en local).
2. Installer le build, puis lancer `npx expo start` depuis `apps/mobile/`.
3. Vérifier :
   - [ ] l'écran d'accueil affiche le logo, en Fredoka, sur fond sable ;
   - [ ] « Voir le design system » ouvre `/dev/ui` ;
   - [ ] les puces Système / Clair / Sombre changent tout l'écran, barre d'état comprise ;
   - [ ] le symbole reste lisible à 24 px (version simplifiée) et ne ressemble pas à une patte ;
   - [ ] les boutons, champs (avec le clavier), toasts et la feuille du bas fonctionnent ;
   - [ ] avec le réglage d'accessibilité « grande taille de texte », rien ne déborde au-delà de 1,3× ;
   - [ ] avec « réduire les animations », les squelettes ne clignotent plus.

> Ce build porte les mêmes identifiants que l'ancienne app : sur un même téléphone, il remplace le build de développement de l'ancienne version.

- [ ] **Point de contrôle (pas de commit).**

---

### Tâche 13 : intégration continue et vérification globale

**Fichiers :**
- Créer : `.github/workflows/ci.yml`

- [ ] **Étape 1 : écrire le workflow**

`.github/workflows/ci.yml` :
```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

- [ ] **Étape 2 : vérification globale, depuis la racine du monorepo**

Lancer dans l'ordre : `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`
Attendu : tout PASSE (Vitest pour `@lokky/shared`, Jest pour `@lokky/mobile`). C'est exactement ce que fera la CI.

- [ ] **Étape 3 : relecture des critères de succès de la spec (§1) couverts par ce jalon**

- [ ] Critère 2 (`lint`, `typecheck`, `test` en CI) : couvert par le workflow.
- [ ] Critère 3 (contraste AA, deux thèmes) : couvert par `themes.test.ts` et `Avatar.test.tsx`.
- [ ] Critère 4 (routes sans logique + règle de dépendances vérifiée automatiquement) : `app/` ne contient que des réexports et la composition des fournisseurs ; règle ESLint prouvée à la tâche 4, étape 9.
- [ ] Critère 5 (basculer `mock` / `http` sans toucher aux écrans) : `src/api/client.ts` choisit le client selon `EXPO_PUBLIC_API_MODE`.
- Critère 1 (parcours v1 de bout en bout) : objet des jalons 2 à 8.

- [ ] **Point de contrôle final (pas de commit)** : l'utilisateur gère lui-même git. Lui signaler que le jalon 1 est prêt à être commité.

---

## Après ce jalon

Écrire le plan détaillé du **jalon 2 (auth et onboarding)** à partir du code réellement en place, avec la même méthode (contrat d'abord, tests d'abord, handlers simulés ajoutés au fil de l'eau).
