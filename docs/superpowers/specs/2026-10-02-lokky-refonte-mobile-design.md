# Lokky — Refonte complète : spec de conception (app mobile v1)

- **Date** : 2026-10-02
- **Statut** : en relecture
- **Périmètre de cette spec** : sous-projet 1 (fondations produit et marque) et sous-projet 3 (app mobile), plus le contrat partagé dont l'app dépend. Le backend, l'admin et la landing page feront chacun l'objet d'une spec séparée.
- **Référence** : l'ancien projet `ProjetLokky/` reste intact et sert uniquement de référence (logique déjà résolue : `$geoNear`, Apple et Google Sign-In, push, etc.). Aucun code n'en est copié sans être relu et réécrit selon cette spec.

---

## 1. Contexte et objectif

Lokky est une application mobile qui aide les gens à **se faire des potes et sortir à Dakar** autour d'activités réelles créées par d'autres utilisateurs.

L'application existante (Expo 54, puis 57) fonctionne mais accumule de la dette : écrans de plus de 1 500 lignes, double gestion de l'auth, aucun test, environ 45 écrans dont une partie hors du cœur de valeur, identité visuelle générique (indigo Tailwind par défaut). Il n'y a pas de base d'utilisateurs à migrer (seulement quelques testeurs). Décision : **reconstruire de zéro** dans un nouveau monorepo, en commençant par l'app mobile.

### Ambition

**Devenir la référence à Dakar** avant toute expansion. L'architecture reste mono-ville, mono-devise (FCFA) et en français d'abord, mais le modèle de données porte un champ `city` pour ne pas fermer la porte à d'autres villes.

### Critères de succès de la v1 mobile

1. Tous les parcours v1 (section 6) fonctionnent de bout en bout en mode `mock`, sur des builds de développement iOS et Android.
2. `lint`, `typecheck` et `test` passent en CI sur chaque push.
3. Toutes les combinaisons texte/fond respectent le contraste WCAG AA, dans les deux thèmes.
4. Aucun fichier de route ne contient de logique, et la règle de dépendances (section 4.3) est vérifiée automatiquement.
5. Basculer de `mock` à `http` ne demande aucune modification d'écran, seulement de la configuration.

---

## 2. Utilisateurs et positionnement

### Cibles

- **Les étudiants** à Dakar qui veulent sortir après les cours, le week-end ou pendant les vacances.
- **Les nouveaux arrivants** (étudiants venus d'ailleurs, expatriés, personnes mutées) qui n'ont pas encore de réseau sur place.

Point commun : **du temps libre, peu de réseau, un budget serré, l'envie de créer du lien.**

### Positionnement

- **100 % amical et social.** Aucun code de rencontre amoureuse : pas de swipe, pas de « match » entre personnes, pas de cœurs. Le produit met en avant **le groupe et l'activité**, pas les profils individuels.
- **Entre pairs** : les activités sont créées par les utilisateurs eux-mêmes. Elles sont **gratuites par défaut**. Si elles ont un coût, c'est « **chacun paie sa part** » et l'organisation se fait dans le chat. **Aucun paiement dans l'app en v1.**
- **Promesse** : « Tu fais quoi ce soir ? », et pouvoir y aller même quand on ne connaît personne.

### Principes UX qui en découlent

1. **Réduire la gêne de venir seul** : toujours montrer qui vient, la taille du groupe, la fiabilité du créateur. Le chat de groupe permet de briser la glace avant le jour J.
2. **Répondre au « quand » de façon concrète** : « Ce soir 19h », « Samedi », plutôt que des dates abstraites.
3. **Le coût est visible tout de suite** : badge « Gratuit » ou « Chacun paie sa part (~3 000 FCFA) ».
4. **La sécurité avant tout** : 18 ans minimum, messages privés uniquement après une activité partagée, signalement et blocage accessibles partout.

---

## 3. Marque

### Personnalité

L'**énergie du pote qui connaît tout le monde** (direct, drôle, tutoiement, « Nanu dem ! ») combinée à la **chaleur du grand frère ou de la grande sœur** (rassurant, accueillant). L'ancrage dakarois (Corniche, Atlantique, couchers de soleil) reste subtil, sans folklore.

### Direction retenue : « Chaleur urbaine »

- **Symbole** : « Coucher de Corniche », un groupe de silhouettes devant un demi-soleil, avec une vague de l'Atlantique. Version finale **simplifiée** : une seule vague épaisse, des espaces élargis entre les personnages, et une **version réduite** (demi-soleil et vague seuls) pour les très petites tailles (icône de notification Android, favicon). Le logo est livré en **SVG** sous forme de composant `<LokkyLogo variant="full | symbol | mono" />`. Une vectorisation par un graphiste pourra le remplacer avant le lancement public.
- **Logotype** : « Lokky » en Fredoka, couleur Charbon.
- **Typographies** : **Fredoka** pour les titres, **Inter** pour le texte (Google Fonts, via `@expo-google-fonts`).
- **Illustrations** : style peint, chaleureux, personnages jeunes d'Afrique de l'Ouest, groupes mixtes, jamais de couples. **Les illustrations de catégorie servent de couverture par défaut** des activités (les utilisateurs ne fournissent pas de photo). Les états vides sont illustrés.
- **Ton** : tutoiement, phrases courtes, quelques mots de wolof. Exemples : « Je viens ! », « Nanu dem ! », « Aucune activité ce soir… et si tu en créais une ? ».

### Couleurs (tokens sémantiques)

Les composants n'utilisent **que des tokens sémantiques**, jamais de valeur hexadécimale en dur. Les ratios de contraste indiqués ont été calculés.

| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `bg` | `#FAF9F6` | `#141A23` | Fond d'écran |
| `surface` | `#FFFFFF` | `#1F2937` | Cartes, feuilles, champs |
| `text` | `#1F2937` (13,9:1) | `#F5F1EA` (15,5:1) | Texte principal |
| `textMuted` | `#6B7280` (4,8:1) | `#9CA3AF` (6,9:1) | Texte secondaire |
| `border` | `#E5E7EB` | `#2D3748` | Séparateurs |
| `brand` | `#FF6B3D` | `#FF6B3D` | Logo, illustrations, icône d'onglet active, décor. **Jamais pour du texte sur fond clair** (2,7:1) |
| `action` / `onAction` | `#C8441C` / `#FFFFFF` (4,9:1) | `#FF6B3D` / `#1F2937` (5,2:1) | Boutons principaux, liens |
| `secondary` | `#007F75` (4,9:1) | `#2DD4BF` (9,4:1) | Badge « Gratuit », éléments de confiance |
| `accent` / `onAccent` | `#FFC857` / `#1F2937` (9,5:1) | idem | Mises en avant (« Ce soir ») |
| `success` | `#15803D` | `#4ADE80` | États |
| `danger` | `#DC2626` | `#F87171` | États |
| `warning` | `#B45309` | `#FBBF24` | États |

### Typographie

| Style | Police | Taille / interligne |
|---|---|---|
| `display` | Fredoka SemiBold | 32 / 40 |
| `title` | Fredoka SemiBold | 24 / 32 |
| `heading` | Fredoka Medium | 20 / 28 |
| `body` | Inter Regular | 16 / 24 |
| `bodyStrong` | Inter SemiBold | 16 / 24 |
| `label` | Inter SemiBold | 15 / 20 |
| `caption` | Inter Medium | 13 / 18 |

La taille de police système est respectée, plafonnée à 1,3×.

### Espacements, coins, ombres, mouvement

- **Espacements** : `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48`. Marge d'écran standard : 20.
- **Coins** : `sm 8` (puces), `md 12` (champs, boutons), `lg 20` (cartes), `full` (avatars, bouton Créer).
- **Ombres** : deux niveaux, douces et teintées Charbon. En mode sombre, des bordures à la place des ombres.
- **Mouvement** : 150 à 250 ms, effet ressort sur « Je viens ! », retour haptique léger sur les actions importantes. Le réglage système « réduire les animations » est respecté.

---

## 4. Architecture

### 4.1 Monorepo

```
Lokky/
├─ package.json            ← npm workspaces + scripts communs (lint, typecheck, test)
├─ packages/
│  └─ shared/              ← contrat v1, aucune dépendance à React
└─ apps/
   └─ mobile/              ← app Expo (cette spec)
   (plus tard : apps/api, apps/admin, apps/web)
```

### 4.2 Stack mobile

| Besoin | Choix |
|---|---|
| Base | Expo SDK 57, expo-router, TypeScript `strict` |
| Monorepo | npm workspaces |
| Données serveur | TanStack Query |
| État local | Zustand (session et préférences uniquement, **jamais de données serveur**) |
| Formulaires | react-hook-form + zod (schémas de `@lokky/shared`) |
| Styles et thème | react-native-unistyles 3. **Sa compatibilité avec RN 0.86 doit être vérifiée en premier.** Plan B : `StyleSheet` + hook de thème maison, avec la même API de tokens |
| Polices | `@expo-google-fonts/fredoka`, `@expo-google-fonts/inter` |
| Icônes | Phosphor (graisse `fill`) |
| Listes | FlashList v2 |
| Images | expo-image |
| Animations | Reanimated 4, expo-haptics |
| Langues | i18next, `fr` d'abord, clés prêtes pour `en` |
| Temps réel | socket.io-client |
| Push | expo-notifications (Expo Push) |
| Erreurs | Sentry React Native |
| Tests | Jest (jest-expo) + React Native Testing Library. Maestro pour l'E2E, plus tard |
| Config | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_MODE=mock\|http`, profils EAS par environnement |

### 4.3 Structure de l'app et règles

```
apps/mobile/
├─ app/                  ← routes expo-router uniquement (fichiers fins)
└─ src/
   ├─ features/          ← auth, onboarding, activities, chat, profile, reviews,
   │                        moderation, notifications, settings
   │                        chaque feature : components/, hooks/, api.ts, screens/
   ├─ ui/                ← design system, sans logique métier
   ├─ theme/             ← tokens, thèmes clair et sombre
   ├─ api/               ← interface ApiClient, HttpClient, MockClient, socket, QueryClient
   ├─ lib/               ← fonctions pures (dates relatives, distance, FCFA)
   ├─ i18n/              ← fr.json, en.json
   └─ assets/            ← polices, illustrations, logo
```

**Règles :**

1. Un fichier de `app/` ne fait que lire les paramètres et afficher un écran venant de `features/`.
2. Les dépendances vont dans un seul sens : `app → features → ui | api | lib | theme → @lokky/shared`. `ui/` n'importe jamais `features/`, et une feature n'importe pas une autre feature. Vérifié par ESLint (`import/no-restricted-paths`).
3. Les composants ne font jamais d'appel réseau : composant → hook → `features/*/api.ts` → `ApiClient`.
4. Repère d'environ 250 lignes par fichier. Au-delà, on découpe.
5. Les types métier viennent de `@lokky/shared` (`z.infer`). Aucune interface métier n'est redéclarée dans l'app.

### 4.4 Identifiants conservés

La nouvelle app **remplace** l'ancienne sur les stores, en mise à jour.

| Élément | Valeur |
|---|---|
| Bundle ID iOS | `com.nach17.Lokky` |
| Package Android | `com.nach17.lokky` |
| EAS `projectId` | `7c688313-8128-4e0f-b8be-9766c1a6d9a5` |
| Apple Team ID | `7UZ7GPX6A4` |
| Scheme | `lokky` |
| Domaine des liens universels | `lokky.akylian.com` (`/activity/*`) |
| Firebase | `google-services.json` / `GoogleService-Info.plist` de l'ancien projet |

**Version de l'app : `2.0.0`.** `runtimeVersion` suit `appVersion`, donc les anciens binaires (1.x) ne recevront jamais de mise à jour OTA de la v2.

---

## 5. Périmètre

### v1 (cette spec)

Découvrir des activités · créer une activité (ponctuelle) · rejoindre et chat de groupe · profil et onboarding · avis après activité et indicateurs de confiance · messages privés (après activité partagée) · modération (signaler, bloquer, états suspendu et banni) · notifications push · réglages et suppression de compte.

### Plus tard

- **v1.1** : galerie photos, intégrée aux souvenirs d'activité.
- **À repenser entièrement** : gamification.
- **Plus tard** : paiement NabooPay et premium.

### Supprimé

Activités récurrentes, followers, « matching » entre personnes, connexion par mot de passe.

---

## 6. Navigation et écrans

### 6.1 Connexion

**Apple, Google, ou email avec code à 6 chiffres. Aucun mot de passe.** L'âge minimum est de **18 ans**, vérifié par la date de naissance à l'onboarding.

### 6.2 Plan des écrans

```
(auth)        Bienvenue (3 slides illustrées) · Connexion · Code email
(onboarding)  Toi (prénom, photo facultative, date de naissance)
              · Ta situation (étudiant·e / nouvel·le arrivant·e / autre + quartier)
              · Tes envies (au moins 3 centres d'intérêt)
              · Autorisations (localisation, notifications)
(tabs)        Découvrir · Mes activités · [+] Créer · Messages · Profil
Empilés       activity/[id] · chat/[id] (groupe ou privé) · user/[id]
              · settings/* (compte, notifications, langue, thème, bloqués, CGU,
                confidentialité, suppression de compte)
              · moderation/* (suspendu, banni)
Sheets        Laisser un avis · Signaler · Filtres avancés
dev only      /dev/ui (vitrine du design system, clair et sombre)
```

- **Découvrir** : « Salut {prénom} 👋 / Tu fais quoi ce soir ? », puces « Ce soir », « Ce week-end », « Gratuit » et catégories, fil d'`ActivityCard`.
- **ActivityCard** : couverture (illustration de catégorie), titre, date relative, quartier et distance, badge de coût, `AvatarStack` + « 6/10 places », badge « Créateur fiable » si applicable.
- **Détail d'activité** : quand, où (mini-carte statique + « Ouvrir dans Maps »), coût, « Qui vient ? », carte du créateur (note, sorties organisées, taux de présence), description, mention « Première fois ? N personnes viennent aussi seules », bouton fixe « Je viens ! ». **Pas de bouton « Suivre ».**
- **Mes activités** : onglets À venir · Passées (avec les avis à laisser) · Créées par moi.
- **Créer** (plein écran, barre de progression) : Quoi ? (catégorie + titre) → Quand ? (raccourcis Ce soir, Demain, Samedi) → Où ? (lieu + point de RDV) → Combien ? (2 à 20) → Coût (Gratuit ou Chacun paie sa part + estimation facultative en FCFA) → Récapitulatif avec l'aperçu de la carte → Publier.
- **Chat** : en-tête avec l'activité et la date, bannière épinglée avec le RDV, bulles, messages système, champ de saisie.
- **Profil** : photo, prénom, quartier, centres d'intérêt, statistiques de confiance, activités à venir. Pas de compteur d'abonnés. Le badge « vérifié » n'est pas en v1 tant que sa signification n'est pas définie.

### 6.3 Règles métier

1. « Je viens ! » ajoute l'utilisateur à l'activité **et** à son chat de groupe, avec un message système « {prénom} a rejoint le groupe ».
2. Cycle de vie : `upcoming` → `ongoing` (de `startsAt` à +3 h) → `past`, ou `cancelled`. Une fois l'activité passée, les participants sont invités à laisser un avis, et le chat reste actif 7 jours avant de passer en lecture seule.
3. On peut quitter jusqu'à `startsAt`. Le créateur peut annuler (tous les participants sont notifiés). La modification est complète tant que personne n'a rejoint, puis limitée à la description et au point de RDV.
4. Messages privés uniquement entre deux utilisateurs ayant participé à une même activité.
5. Activité complète : bouton « Complet », pas de liste d'attente.
6. Un utilisateur bloqué ne voit plus les activités de la personne qui l'a bloqué, et réciproquement. Ils ne peuvent plus s'écrire.
7. `lokky.akylian.com/activity/:id` ouvre le détail dans l'app.
8. Chaque liste a un état vide illustré avec une action.

---

## 7. Données, API et temps réel

### 7.1 Contrat partagé (`@lokky/shared`)

Schémas zod, source unique des types pour l'app et le futur backend.

- `User` (public) : `id`, `firstName`, `avatarUrl?`, `status` (`student` | `newcomer` | `other`), `neighborhood`, `interests[]`, `trust` (`activitiesAttended`, `attendanceRate`, `activitiesCreated`, `creatorRating?`, `creatorReviewCount`).
- `Me` : `User` + `email`, `birthDate`, `preferences` (`language`, `theme`, `notifications`).
- `Activity` : `id`, `title`, `category`, `description`, `startsAt`, `location` (`name`, `coordinates`, `meetingPoint?`), `capacity`, `cost` (`{ type: 'free' }` | `{ type: 'split', estimateFcfa?: number }`), `creator` (aperçu `User`), `participantCount`, `participantsPreview[]`, `status`, `city`, `viewerState` (`isParticipant`, `isCreator`, `canJoin`, `canReview`).
- `Conversation` : `id`, `type` (`group` + `activityId` | `direct`), `title`, `lastMessage?`, `unreadCount`.
- `Message` : `id`, `clientId`, `conversationId`, `sender` (aperçu), `type` (`text` | `system`), `body`, `createdAt`.
- `Review` : `activityId`, `creatorRating` (1 à 5), `comment?`. Présence : le créateur déclare la présence de chaque participant.
- `Report` : `targetType` (`user` | `activity` | `message`), `targetId`, `reason`, `details?`.
- `Block` : `userId`.
- **Routes** : décrites dans le package (méthode, chemin, schéma d'entrée, schéma de sortie). Pagination par curseur (`{ items, nextCursor }`) pour toute liste.
- **Événements socket** typés : `message:new`, `typing`, `conversation:read`, `unread:update`, `activity:updated`, `activity:cancelled`, `moderation:update`.
- **Constantes** : catégories (Sport, Plage, Ciné, Études, Musique et sorties, Jeux, Food et thé, Culture, Balade), capacité 2 à 20, limites de longueur des champs.

### 7.2 Couche API de l'app

- Une interface `ApiClient` avec deux implémentations : `HttpClient` et `MockClient` (données en mémoire réalistes sur Dakar, latence simulée, injection d'erreurs activable). Le choix se fait avec `EXPO_PUBLIC_API_MODE`.
- **Auth** : access token de 15 min + refresh token, stockés dans SecureStore. Le rafraîchissement automatique sur 401 est **mutualisé** (une seule requête de rafraîchissement à la fois). En cas d'échec, déconnexion propre.
- **Mises à jour optimistes** sur « Je viens ! », « Quitter » et l'envoi de messages, avec retour en arrière et toast en cas de refus.

### 7.3 Temps réel

- Socket.IO pour le chat et les événements personnels. **Aucun polling.**
- Resynchronisation (invalidation TanStack Query) au retour au premier plan et à la reconnexion du socket.
- Un `MockSocket` simule des réponses dans le chat en mode `mock`.

### 7.4 Notifications, localisation, images

- **Push** : enregistrement du token Expo après l'onboarding. Un appui sur une notification ouvre le bon écran (deep link).
- **Localisation** : uniquement pendant l'utilisation de l'app. En cas de refus, on se rabat sur le quartier déclaré.
- **Images** : seulement l'avatar en v1. Compression sur le téléphone, puis envoi via une URL signée fournie par l'API. En mode `mock`, l'URI locale est conservée.

### 7.5 Erreurs et robustesse

- Un ErrorBoundary par écran (écran illustré + « Réessayer »), avec remontée à Sentry.
- Une bannière hors-ligne (NetInfo). Le cache TanStack Query reste lisible, et l'envoi de messages est mis en file puis rejoué à la reconnexion.
- Des Skeleton au chargement.

---

## 8. Design system (`src/ui/`)

**Composants de base** : `Text`, `Button` (primary, secondary, ghost, danger × sm, md, lg, état chargement), `IconButton`, `Input`, `TextArea` (erreur, compteur), `Chip`, `Badge`, `Avatar`, `AvatarStack`, `Card`, `Divider`, `Skeleton`, `Sheet`, `Toast`, `EmptyState`, `ScreenHeader`, `Stepper`.

**Composés métier** (dans `features/`) : `ActivityCard`, `ActivityCover`, `ParticipantsRow`, `CreatorTrustCard`, `ChatBubble`, `PinnedMeetupBanner`, `TrustStats`.

**Logo** : `LokkyLogo` (SVG, variantes `full`, `symbol`, `mono`).

Tous les composants sont visibles dans `/dev/ui`, en clair et en sombre, et le design system est validé là avant les écrans.

---

## 9. Qualité

- **TypeScript `strict`**, ESLint (config Expo + règle de dépendances), Prettier.
- **Tests** :
  - unitaires pour `lib/` et les schémas de `shared` ;
  - composants de `ui/` ;
  - parcours clés sur `MockClient` : rejoindre une activité, créer une activité, envoyer un message, signaler.
- **CI GitHub Actions** : `lint`, `typecheck`, `test` sur chaque push et chaque PR.
- **Commits** au format Conventional Commits (`feat(activities): …`).
- **Accessibilité** : contraste AA, zones tactiles d'au moins 44 pt, `accessibilityLabel` sur les boutons-icônes, tailles de police dynamiques.

---

## 10. Ordre de construction

1. Monorepo, projet Expo neuf avec les identifiants conservés, outillage (lint, tests, CI)
2. Contrat `shared` v1 + `MockClient`
3. Thème et design system, `/dev/ui`, logo SVG
4. Auth et onboarding
5. Découvrir et détail d'activité
6. Créer une activité
7. Rejoindre et chat de groupe (`MockSocket`)
8. Mes activités, avis, profils
9. Messages privés, modération, réglages, suppression de compte
10. Notifications, deep links, finitions (animations, haptique, états vides)

---

## 11. Hors périmètre de cette spec

- Le backend (`apps/api`), qui fera l'objet d'une spec dédiée et implémentera le contrat `@lokky/shared`.
- L'admin et la landing page.
- Le paiement, le premium, la gamification et la galerie.
- L'E2E Maestro et l'analytics produit, qui viendront après la v1.

## 12. Points ouverts

1. **Compatibilité d'Unistyles 3 avec RN 0.86** : à vérifier à l'étape 1, sinon on passe au plan B.
2. **Logo** : la version SVG est dessinée en interne. Une vectorisation professionnelle est envisagée avant le lancement public.
3. **Badge « vérifié »** : pas en v1 tant que son critère (email, téléphone, carte étudiante) n'est pas décidé.
4. **Illustrations** : celles générées pendant l'exploration servent de maquettes. Les fichiers définitifs (catégories, onboarding, états vides) restent à produire dans un style unique. Des placeholders sont utilisés en attendant.
5. **Firebase** : son usage exact dans la v2 est à confirmer (Expo Push s'appuie sur FCM côté Android, donc `google-services.json` reste nécessaire).
