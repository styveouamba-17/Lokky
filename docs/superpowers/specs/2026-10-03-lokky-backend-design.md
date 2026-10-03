# Lokky — Backend : spec de conception (API v1)

- **Date** : 2026-10-03
- **Statut** : en relecture
- **Périmètre** : le backend `apps/api` qui implémente le contrat `@lokky/shared` utilisé par l'app mobile (spec du 2026-10-02). L'admin de modération fera l'objet d'une spec séparée, juste après.
- **Référence** : l'ancien `ProjetLokky/Backend` (Express, MongoDB, ~13 900 lignes) reste une référence de logique déjà résolue (vérification Apple et Google, envoi des push, rappels). Rien n'en est copié sans être relu et réécrit. Ses secrets (`.env`, clé Firebase Admin) ne doivent jamais entrer dans ce dépôt.

---

## 1. Objectif

Remplacer le serveur simulé de l'app (`apps/mobile/src/api/mock`) par une vraie API, **sans changer une ligne d'écran** : l'app passe de `EXPO_PUBLIC_API_MODE=mock` à `http` et tout fonctionne.

### Critères de succès

1. Chaque route de `routes` (`@lokky/shared`) est implémentée, et ses entrées et sorties respectent les schémas zod (vérifié par les tests).
2. Les scénarios déjà testés sur le serveur simulé (rejoindre, avis, présence, messages privés, blocage, signalement, suppression…) passent aussi contre la vraie API, sur une vraie base PostgreSQL.
3. Les événements socket typés (`ServerToClientEvents`) sont émis aux bonnes personnes, et seulement à elles.
4. Les règles métier qui touchent à la sécurité sont garanties par la base (contraintes, transactions), pas seulement par le code.
5. L'API tourne sur le VPS en HTTPS, avec sauvegardes quotidiennes et suivi des erreurs.
6. `lint`, `typecheck` et `test` passent en CI pour tout le monorepo.

---

## 2. Stack

| Domaine                  | Choix                                                        | Rôle                                                                |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| Langage                  | TypeScript (strict), Node 24 LTS (comme `.nvmrc`)            | Même langage que l'app, contrat partagé tel quel                    |
| HTTP                     | **Fastify 5**                                                | Routes générées depuis la table `routes` du contrat, validation zod |
| Base de données          | **PostgreSQL 17 + PostGIS**                                  | Données relationnelles, contraintes, recherche par distance         |
| Accès aux données        | **Drizzle ORM** + drizzle-kit                                | Schéma en TypeScript, SQL lisible, migrations versionnées           |
| Temps réel               | **Socket.IO 4** + adaptateur Redis                           | Chat, saisie, non-lus, événements personnels                        |
| File de tâches           | **BullMQ** (Redis 7)                                         | Rappels, demandes d'avis, push, purge des comptes                   |
| Emails                   | **Resend**                                                   | Codes de connexion à 6 chiffres                                     |
| Push                     | **expo-server-sdk**                                          | Envoi via le service Expo (FCM et APNs gérés par Expo)              |
| Fichiers                 | **Cloudflare R2** (API S3)                                   | Avatars, envoi direct depuis le téléphone par URL signée            |
| Connexion Apple / Google | `jose` (vérification des jetons via les clés publiques JWKS) | Pas de SDK Firebase côté serveur                                    |
| Jetons de session        | JWT d'accès (`jose`) + refresh tokens opaques en base        | Voir §5                                                             |
| Journaux                 | **pino** (intégré à Fastify)                                 | JSON structuré, sans données personnelles                           |
| Erreurs                  | **Sentry** (`@sentry/node`)                                  | Même organisation que l'app                                         |
| Tests                    | **Vitest** + PostgreSQL de test (Docker)                     | Tests d'intégration sur une vraie base                              |
| Déploiement              | **Docker Compose** sur le VPS + **Caddy**                    | HTTPS automatique (Let's Encrypt)                                   |

**Pourquoi PostgreSQL plutôt que MongoDB** (ancien backend) : les données de Lokky sont relationnelles (utilisateurs, sorties, participations, conversations, avis, blocages), et plusieurs règles produit sont des contraintes que la base garantit d'elle-même : capacité d'une sortie sous concurrence, un avis par personne, une conversation privée par paire, un blocage unique. PostGIS remplace `$geoNear`. Aucun utilisateur à migrer : le changement ne coûte rien maintenant.

---

## 3. Place dans le monorepo

```
apps/
  mobile/            l'app (existante)
  api/               ← ce backend
packages/
  shared/            le contrat : schémas zod, routes, événements socket, données push
```

- `apps/api` dépend de `@lokky/shared` comme l'app. Un changement de contrat casse le typecheck des deux côtés en même temps.
- Le serveur simulé de l'app **reste** : il sert au développement de l'app hors ligne, aux tests de l'app et aux démos. Les deux implémentations suivent le même contrat.

### Ajouts au contrat (`@lokky/shared`)

1. **`parseQuery(def, query)`** : les paramètres d'une requête GET arrivent en texte (`lat=14.69`, `freeOnly=true`, `categories=sport&categories=beach`). Cette fonction les reconvertit (nombres, booléens, tableaux) avant la validation zod. Elle est l'inverse exact de `toQueryString` déjà utilisé par l'app, et testée ensemble.
2. **Curseurs opaques** : le serveur simulé utilise un décalage (`"20"`). Le vrai serveur renvoie des curseurs opaques (position encodée en base64url). Le format reste une chaîne : rien ne change pour l'app.
3. Aucun autre changement prévu. Toute évolution du contrat se fait dans `shared` d'abord.

---

## 4. Architecture de `apps/api`

```
apps/api/
  src/
    main.ts            démarrage : HTTP, Socket.IO, workers
    app.ts             construction de l'app Fastify (testable sans réseau)
    config.ts          variables d'environnement validées par zod (démarrage refusé si invalide)
    http/
      registerRoutes.ts   transforme la table `routes` du contrat en routes Fastify
      auth.ts             vérification du jeton d'accès, utilisateur courant
      errors.ts           erreurs métier → { error: { code, message } } du contrat
    modules/
      auth/            email + code, Apple, Google, refresh, logout
      users/           me, onboarding, profil public, avatar (R2)
      activities/      fil, détail, création, modification, annulation, rejoindre, quitter, mes activités
      trust/           avis, présence, statistiques de confiance
      chat/            conversations, messages, non-lus, messages privés
      safety/          signalements, blocages, suppression de compte, statut de modération
      push/            jetons, préférences, envoi
    realtime/          Socket.IO : authentification, salles, émission typée
    jobs/              BullMQ : rappels, après-sortie, push, purge
    db/
      schema.ts        schéma Drizzle (toutes les tables)
      migrations/      SQL généré et relu, versionné
      seed.ts          données de démo (mêmes personnes et sorties que le serveur simulé)
  test/
  Dockerfile
```

### Règles d'architecture

- **Un handler par route du contrat**, avec la même signature que les handlers simulés : `(input validé, contexte) → sortie`. `registerRoutes` s'occupe de la méthode, du chemin, de l'authentification, de la validation d'entrée **et de sortie**. Une sortie hors contrat est une erreur 500 en développement (comme le client simulé), journalisée en production.
- **Un module ne lit pas les tables d'un autre module.** Il passe par les fonctions exportées par ce module (ex. `chat` appelle `activities.isParticipant`, `safety.isBlockedEitherWay`). Vérifié par une règle de lint, comme dans l'app.
- **Les règles métier vivent dans les modules**, pas dans les routes ni dans le schéma Drizzle.
- **Le temps réel et les push ne sont jamais appelés directement** par un module : un module publie un événement de domaine (`activity.joined`, `message.created`…). Le temps réel et la file de push s'y abonnent. Les modules restent simples à tester.
- **Pas d'état en mémoire** dans le processus : tout est en base ou dans Redis. On peut lancer plusieurs instances.

---

## 5. Authentification

| Élément                                 | Choix                                                                                                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jeton d'accès                           | JWT signé (EdDSA), **15 min**, contient l'identifiant et la version de session                                                                                               |
| Refresh token                           | Valeur aléatoire de 256 bits, stockée **hachée** (SHA-256) en base, **30 jours**, rotation à chaque usage                                                                    |
| Réutilisation d'un refresh déjà utilisé | Toute la famille de sessions est révoquée (vol probable)                                                                                                                     |
| Déconnexion                             | `auth.logout` révoque le refresh token présenté                                                                                                                              |
| Code email                              | 6 chiffres, valide **10 min**, haché en base, **5 essais** max, 1 envoi par minute et par adresse                                                                            |
| Apple                                   | Vérification du `idToken` avec les clés publiques d'Apple (`jose`), audience = bundle `com.nach17.Lokky` ; le prénom n'arrive qu'à la 1re connexion (`firstName` du contrat) |
| Google                                  | Vérification du `idToken` avec les clés publiques de Google, audiences = identifiants client iOS, Android et web                                                             |
| Compte                                  | Identifié par l'email vérifié ; Apple, Google et email mènent au même compte si l'email est le même                                                                          |
| Onboarding                              | `auth.*` renvoie `user: null` tant que le profil n'est pas rempli ; `me.get` répond `onboarding_required`                                                                    |
| Modération                              | Compte suspendu ou banni : les routes qui écrivent répondent `account_suspended` / `account_banned` ; la lecture de `/me` reste possible (l'app affiche l'écran dédié)       |

---

## 6. Données (PostgreSQL)

Identifiants : UUID v7 (triables dans le temps). Dates : `timestamptz`, en UTC (Dakar est à UTC+0).

| Table                  | Contenu                                                                                                                                  | Contraintes clés                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `users`                | email, prénom, date de naissance, statut, quartier, centres d'intérêt, avatar, préférences (jsonb), statut de modération, `deleted_at`   | email unique (insensible à la casse) ; 18 ans vérifié à l'onboarding              |
| `auth_identities`      | lien Apple / Google → utilisateur                                                                                                        | (fournisseur, identifiant fournisseur) unique                                     |
| `email_codes`          | code haché, expiration, essais                                                                                                           |                                                                                   |
| `sessions`             | refresh token haché, famille, expiration, révocation                                                                                     |                                                                                   |
| `push_tokens`          | jeton Expo, plateforme, dernière utilisation                                                                                             | jeton unique                                                                      |
| `activities`           | titre, catégorie, description, début, lieu (`geography(Point)`), point de RDV, quartier, capacité, coût, créateur, ville, `cancelled_at` | capacité 2 à 20 ; index GiST sur le lieu ; index sur `starts_at`                  |
| `participations`       | sortie, utilisateur, date, présence déclarée                                                                                             | (sortie, utilisateur) unique                                                      |
| `reviews`              | sortie, auteur, note 1 à 5, commentaire                                                                                                  | (sortie, auteur) unique                                                           |
| `conversations`        | type (groupe / privé), sortie liée (groupe)                                                                                              | une conversation de groupe par sortie (unique)                                    |
| `conversation_members` | membre, dernière lecture                                                                                                                 | (conversation, utilisateur) unique ; paire privée unique via une clé `direct_key` |
| `messages`             | conversation, auteur (null = système), type, texte, `client_id`                                                                          | (conversation, auteur, `client_id`) unique → envoi idempotent                     |
| `blocks`               | qui bloque, qui est bloqué, date                                                                                                         | (bloqueur, bloqué) unique                                                         |
| `reports`              | auteur, cible (type + id), motif, détails, statut de traitement                                                                          |                                                                                   |
| `moderation_events`    | historique des avertissements, suspensions, bannissements                                                                                | utilisé par l'admin                                                               |

### Règles garanties par la base

- **Capacité** : rejoindre se fait dans une transaction qui verrouille la sortie (`SELECT … FOR UPDATE`), compte les participants et insère ; deux « Je viens ! » simultanés sur la dernière place ne peuvent pas passer tous les deux (`activity_full`).
- **Idempotence** : rejoindre deux fois, envoyer deux fois le même `clientId`, laisser deux avis → contraintes d'unicité, réponse identique à la première.
- **Statistiques de confiance** (`TrustStats`) : calculées à partir de `participations`, `reviews` et `activities`, dans une vue matérialisée rafraîchie après chaque avis ou déclaration de présence (pas de compteurs approximatifs comme dans le serveur simulé).
- **Statut d'une sortie** (`upcoming`, `ongoing`, `past`, `cancelled`) : jamais stocké, calculé à la lecture avec `getActivityStatus` de `shared`, comme dans l'app.

---

## 7. Règles métier (rappel de la spec app, côté serveur)

1. « Je viens ! » ajoute à la sortie **et** à son groupe, avec le message système « {prénom} a rejoint le groupe ». Quitter publie « {prénom} a quitté le groupe ».
2. Rejoindre seulement une sortie `upcoming`, non complète ; quitter jusqu'au début ; le créateur ne quitte pas sa sortie (il l'annule).
3. Modification complète tant que personne n'a rejoint, puis limitée à la description et au point de RDV. Annulation par le créateur seulement ; tous les participants sont prévenus (socket + push).
4. Chat de groupe actif jusqu'à 7 jours après la fin (ou l'annulation), puis en lecture seule (`isChatReadOnly` de `shared`).
5. Message privé seulement entre deux personnes ayant participé à une même sortie **passée** ; une seule conversation par paire.
6. Blocage : les sorties de l'un disparaissent du fil de l'autre (dans les deux sens), la conversation privée se ferme et sort de la liste, les messages de l'un ne sont plus livrés à l'autre ; une personne qui t'a bloqué devient introuvable.
7. Avis : participant (pas le créateur), sortie passée, une fois. Présence : déclarée une fois par le créateur, pour ses participants.
8. Profil public : seulement les prochaines sorties **organisées** par la personne.
9. Suppression de compte : anonymisation immédiate (profil retiré, prénom remplacé par « Utilisateur supprimé », sessions et jetons push révoqués, participations futures retirées), puis effacement définitif à **J+30** par une tâche planifiée. Ce délai doit correspondre à la politique de confidentialité de l'app.

---

## 8. Recherche par distance (fil Découvrir)

- Le lieu d'une sortie est un `geography(Point, 4326)` avec un index GiST.
- `activities.list` avec `lat`/`lng` : filtre `ST_DWithin(lieu, position, rayon)` et calcule `distanceKm`. Sans position : pas de filtre de distance, `distanceKm = null` (l'app se rabat déjà sur le quartier).
- Filtres `when` (`getWhenRange` de `shared`), catégories, gratuit ; exclusion des sorties annulées et des créateurs bloqués (dans les deux sens).
- Tri par date de début ; pagination par curseur (date de début + identifiant).

---

## 9. Temps réel (Socket.IO)

- **Connexion** : le jeton d'accès est envoyé dans `auth.token` (déjà fait par l'app). Jeton invalide ou expiré : refus avec le message `unauthorized` (l'app rafraîchit puis se reconnecte).
- **Salles** : `user:{id}` (événements personnels) et `conversation:{id}`. À la connexion, l'utilisateur rejoint automatiquement ses conversations ; `conversation:join` / `leave` restent acceptés mais contrôlés (membre seulement).
- **Événements émis** :

| Événement            | À qui                                     | Quand                                                    |
| -------------------- | ----------------------------------------- | -------------------------------------------------------- |
| `message:new`        | membres de la conversation (sauf bloqués) | message ou message système créé                          |
| `typing`             | membres de la conversation, sauf l'auteur | relais de `typing`, limité à 1 par seconde               |
| `conversation:read`  | membres de la conversation                | quelqu'un marque comme lu                                |
| `unread:update`      | `user:{id}`                               | le total de non-lus change                               |
| `activity:updated`   | participants                              | modification de la sortie                                |
| `activity:cancelled` | participants                              | annulation                                               |
| `moderation:update`  | `user:{id}`                               | avertissement, suspension, bannissement (depuis l'admin) |

- **Envoi des messages** : toujours par HTTP (`messages.send`), jamais par le socket, comme prévu dans le contrat.
- **Plusieurs instances** : adaptateur Redis de Socket.IO.

---

## 10. Tâches planifiées et push (BullMQ)

| Tâche                       | Déclenchement                                                              | Effet                                                                                        |
| --------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Rappel avant la sortie      | 2 h avant `startsAt` (replanifiée si la sortie change, retirée si annulée) | push `activity_reminder` aux participants                                                    |
| Après la sortie             | `startsAt` + 3 h                                                           | push `after_activity` : avis pour les participants, présence pour le créateur                |
| Push d'un nouveau message   | à chaque message, regroupé 5 s par conversation et par destinataire        | push `message`, sauf si la conversation a été lue entre-temps                                |
| Envoi des push              | file dédiée                                                                | via expo-server-sdk, lots de 100 ; jetons refusés par Expo (`DeviceNotRegistered`) supprimés |
| Purge des comptes supprimés | chaque nuit                                                                | effacement définitif après 30 jours                                                          |
| Nettoyage                   | chaque nuit                                                                | codes email et sessions expirés                                                              |

- Les données jointes suivent `pushDataSchema` de `shared` ; titre et texte rédigés par le serveur, en français.
- Les préférences de notification du compte (`messages`, `activityUpdates`, `reminders`) sont respectées avant tout envoi.
- Toutes les tâches sont **idempotentes** (identifiant de tâche déterministe) : une tâche rejouée n'envoie pas deux fois.

---

## 11. Avatars (Cloudflare R2)

1. L'app demande `me.avatarUploadUrl` avec le type d'image.
2. Le serveur renvoie une URL `PUT` signée (S3 v4), valable **5 min**, limitée au type annoncé et à **2 Mo**, vers la clé `avatars/{userId}/{uuid}.jpg`.
3. L'app envoie l'image directement à R2, puis enregistre `publicUrl` avec `me.update`.
4. Le serveur n'accepte comme `avatarUrl` qu'une URL de son propre domaine d'avatars, sous le dossier de l'utilisateur.
5. Le bucket est servi en lecture publique par **l'URL publique par défaut de R2** (`https://pub-….r2.dev`), configurée par variable d'environnement (`AVATAR_PUBLIC_BASE_URL`). Un domaine personnalisé (ex. `media.lokky.app`) pourra la remplacer sans changer l'app, puisque `avatarUrl` est une URL complète. L'ancien avatar est supprimé par une tâche après remplacement.

---

## 12. Sécurité

- HTTPS uniquement (Caddy) ; en-têtes de sécurité (`@fastify/helmet`) ; CORS fermé (l'app mobile n'en a pas besoin, l'admin aura son origine).
- **Limitation de débit** (Redis) : codes email (par adresse et par IP), connexion, envoi de messages (ex. 20 par minute), signalements, création de sorties (ex. 10 par jour).
- Validation de **toutes** les entrées par les schémas du contrat ; les limites de longueur sont celles de `LIMITS`.
- Aucune donnée personnelle dans les journaux ni dans Sentry (email, date de naissance, contenu des messages masqués).
- Secrets uniquement dans les variables d'environnement du serveur (jamais dans le dépôt), base et Redis accessibles seulement depuis le réseau Docker interne.
- Requêtes SQL toujours paramétrées (Drizzle).

---

## 13. Hébergement (VPS)

```
Internet → Caddy (HTTPS, api.<domaine>)
             └─ api (Node, 1 à N conteneurs : HTTP + Socket.IO)
             └─ worker (Node, tâches BullMQ)
           postgres (PostGIS)   redis      ← réseau interne uniquement
```

- **Docker Compose** : `caddy`, `api`, `worker`, `postgres`, `redis`. Même image pour `api` et `worker`, commande différente.
- **Région** : un VPS en Europe de l'Ouest (Paris ou Londres) : la plus proche de Dakar. Taille de départ : 2 vCPU, 4 Go de RAM. Fournisseur choisi au moment de l'achat ; rien dans le déploiement n'en dépend (Docker Compose seulement).
- **Déploiement** : GitHub Actions construit l'image, la pousse sur un registre (GitHub Container Registry), puis le VPS la récupère et relance (`docker compose pull && up -d`). Les migrations Drizzle s'exécutent avant le démarrage de la nouvelle version.
- **Sauvegardes** : `pg_dump` chiffré chaque nuit vers un bucket R2 séparé, conservé 30 jours ; restauration testée une fois avant le lancement.
- **Surveillance** : route `GET /health` (base, Redis), surveillance externe (ex. UptimeRobot), Sentry, journaux Docker avec rotation.
- **Environnements** : `production` sur le VPS ; `staging` sur le même VPS (base séparée) pour les builds `preview` de l'app.
- Le même domaine sert les fichiers des liens universels (`apple-app-site-association`, `assetlinks.json`) et la page web de secours `/activity/:id`, avec la landing page (spec séparée).

---

## 14. Tests

- **Unitaires** (Vitest) : règles métier pures (capacité, délais, droits d'écrire, calcul des statistiques).
- **Intégration** : chaque route appelée via `app.inject` de Fastify, sur une vraie base PostgreSQL de test (conteneur Docker, schéma remis à zéro entre les fichiers). Les sorties sont validées par les schémas du contrat.
- **Scénarios repris du serveur simulé** : les tests de `apps/mobile/src/api/mock/__tests__` (chat, avis, présence, sécurité…) sont réécrits contre la vraie API, avec les mêmes données de démo (`seed.ts`). Les deux implémentations restent ainsi alignées.
- **Concurrence** : deux « Je viens ! » simultanés sur la dernière place, deux envois avec le même `clientId`.
- **Temps réel** : un client Socket.IO de test vérifie qui reçoit quoi (et qu'un bloqué ne reçoit rien).
- **CI** : PostgreSQL et Redis en services GitHub Actions ; `lint`, `typecheck`, `test` sur tout le monorepo.

---

## 15. Étapes de réalisation

| Étape | Contenu                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1    | Socle : `apps/api`, Fastify, config, Drizzle + migrations, Docker Compose local, `parseQuery` dans `shared`, `registerRoutes` depuis le contrat, erreurs, santé, CI |
| B2    | Authentification : email + code (Resend), Apple, Google, sessions et refresh, `me.*`, onboarding, avatars R2                                                        |
| B3    | Sorties : fil avec PostGIS, détail, création, modification, annulation, rejoindre et quitter (transaction), mes activités, profil public                            |
| B4    | Chat : conversations, messages, non-lus, messages système, messages privés, Socket.IO (salles, événements, Redis)                                                   |
| B5    | Confiance et sécurité : avis, présence, statistiques, blocages, signalements, suppression de compte, statut de modération                                           |
| B6    | Tâches et push : jetons, préférences, rappels, après-sortie, push des messages, purge                                                                               |
| B7    | Mise en production : VPS, Caddy, déploiement continu, sauvegardes, staging, Sentry ; l'app passe en mode `http`                                                     |

Chaque étape se termine avec ses tests d'intégration verts et l'app capable d'utiliser les routes concernées en mode `http`.

---

## 16. Hors périmètre

- L'**admin de modération** (traitement des signalements, avertir, suspendre, bannir, statistiques) : spec suivante. D'ici là, un script en ligne de commande permet de changer le statut de modération d'un compte (et émet `moderation:update`).
- La landing page et la page web de secours des liens (spec séparée).
- Le paiement, le premium, l'analytics produit.
- La traduction anglaise des notifications (le contrat le permettra : préférence `language`).

## 17. Décisions prises (relecture du 2026-10-03)

1. **Avatars** : URL publique par défaut de R2 pour commencer (voir §11).
2. **VPS** : fournisseur choisi au moment de l'achat, région Paris ou Londres.
3. **Emails** : envoyés depuis le domaine déjà vérifié dans Resend.
4. **Google** : on réutilise les identifiants OAuth (clients iOS, Android, web) de l'ancien projet.
5. **Rappel** : un seul, 2 h avant la sortie.

## 18. Changement de domaine (`lokky.app`)

Le domaine définitif sera `lokky.app` (achat prévu). D'ici là, tout utilise `lokky.akylian.com`. Le jour du changement :

- **Backend** : variables d'environnement seulement (`PUBLIC_WEB_ORIGIN`, `API_PUBLIC_URL`, adresse d'envoi des emails, domaine vérifié dans Resend) et le nom de domaine dans la configuration de Caddy. Aucun domaine n'est écrit en dur dans le code de l'API.
- **App** : `app.config.ts` (`associatedDomains`, `intentFilters`), `src/lib/share.ts` (`WEB_ORIGIN`), `src/lib/links.ts` (adresse de contact), puis un nouveau build (les liens universels sont natifs). Garder l'ancien domaine dans `associatedDomains` et `intentFilters` pendant une transition, pour que les liens déjà partagés continuent d'ouvrir l'app.
- **Site** : publier `apple-app-site-association` et `assetlinks.json` sur le nouveau domaine, et rediriger l'ancien vers le nouveau.
- **Textes légaux** : adresse de contact.
