# Lokky — Mise en production (jalon 8)

Ce qui est prêt dans l'app, et ce qu'il reste à faire **en dehors du code** pour que notifications, liens et suivi des plantages fonctionnent en vrai.

## 0. Nouveau build de développement

Le jalon 8 ajoute un module natif (`react-native-keyboard-controller`, clavier du chat). Le build de développement actuel ne le contient pas :

```bash
cd apps/mobile
npx eas-cli@latest build --profile development --platform all
```

### Tester l'authentification sociale contre l'API locale

Le profil EAS `development` utilise le vrai backend (`EXPO_PUBLIC_API_MODE=http`). En lancement
local, l'app utilise aussi le vrai backend par défaut et déduit l'adresse LAN depuis Metro
(port API `3000`). Téléphone et ordinateur doivent être sur le même réseau ; l'API doit être
démarrée avec `npm run dev -w @lokky/api` après configuration de sa base locale. Le serveur
écoute sur `0.0.0.0`, donc il est joignable depuis le téléphone. Tester l'API sur
`http://localhost:3000/health` depuis l'ordinateur ne vérifie pas l'accès depuis le téléphone.

Apple/Google ne sont réellement vérifiés que lorsque l'app appelle l'API HTTP. En mode mock,
le client simulé accepte n'importe quel jeton et ne teste pas la validation des fournisseurs.
Apple Sign-In s'essaie sur iOS ; Google peut être testé sur Android ou iOS avec un build natif
de développement. Une première connexion OAuth nécessite un email vérifié.

## 1. Liens vers une sortie (`lokky.app/activity/:id`)

L'app est configurée (`app.config.ts` : `associatedDomains` iOS, `intentFilters` Android). Les **deux fichiers** sont dans `apps/web/public/.well-known/` et publiés avec le site (Vercel, §5), en HTTPS, avec le type `application/json` (`apps/web/vercel.json`) et sans redirection.

### iOS : `/.well-known/apple-app-site-association` (sans extension)

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["7UZ7GPX6A4.com.nach17.Lokky"],
        "components": [{ "/": "/activity/*" }]
      }
    ]
  }
}
```

### Android : `/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.nach17.lokky",
      "sha256_cert_fingerprints": ["EMPREINTE_SHA256_DU_CERTIFICAT"]
    }
  }
]
```

**À faire** : remplacer `REMPLACER_PAR_L_EMPREINTE_SHA256_DE_LA_CLE_DE_SIGNATURE` dans `apps/web/public/.well-known/assetlinks.json`. L'empreinte s'obtient avec `npx eas-cli@latest credentials -p android` (certificat de signature de production). Si l'app est distribuée par Google Play, ajoute aussi l'empreinte « App signing key » de la Play Console (la liste accepte plusieurs empreintes).

### Page web de secours

Le site public `apps/web` présente Lokky et est généré en statique par Astro (`npm run build --workspace @lokky/web` → `apps/web/dist`). Il peut être publié sur un hébergeur statique depuis le monorepo.

`/activity/:id` sert une page de secours unique (`src/pages/activity/index.astro`, réécriture dans `vercel.json`) : bouton « Ouvrir dans Lokky » (`lokky://activity/:id`) et liens des stores (`src/config.ts`). Le lien App Store ne s'affiche qu'une fois `STORE_LINKS.ios` renseigné avec l'identifiant App Store Connect.

### Comportement dans l'app

- Connecté : la sortie s'ouvre par-dessus les onglets.
- Pas connecté : la sortie est gardée de côté et s'ouvre juste après la connexion (ou l'onboarding).
- Bouton « Partager » sur le détail d'une sortie : envoie le titre, la date et le lien.

## 2. Notifications push

L'app enregistre son jeton Expo (`POST /me/push-token`) une fois connectée, si la notification est autorisée (demandée pendant l'onboarding). Le backend envoie ensuite via l'API Expo Push (`https://exp.host/--/api/v2/push/send`).

### Données à joindre (`data`) — contrat `pushDataSchema` de `@lokky/shared`

| `type` | Champ | Quand | Écran ouvert au toucher |
|---|---|---|---|
| `message` | `conversationId` | Nouveau message (groupe ou privé) | La conversation |
| `activity_joined` | `activityId` | Quelqu'un rejoint ta sortie | Le détail |
| `activity_updated` | `activityId` | Description ou point de RDV modifié | Le détail |
| `activity_cancelled` | `activityId` | Sortie annulée | Le détail |
| `activity_reminder` | `activityId` | Rappel avant la sortie | Le détail |
| `after_activity` | `activityId` | Laisser un avis / indiquer qui est venu | Le détail (boutons en bas) |

Le titre et le texte sont rédigés par le serveur. Respecter les préférences du compte (`preferences.notifications.messages`, `activityUpdates`, `reminders`). Sur Android, le canal par défaut s'appelle `default`.

Un message pour la conversation déjà ouverte n'affiche pas de bannière (l'app filtre).
Le badge de l'icône affiche le nombre de messages non lus : il est synchronisé quand l'app est
ouverte et porté par les push de message quand elle est en arrière-plan. Sur iOS, l'autorisation
des badges doit être accordée ; sur Android, l'affichage dépend du launcher utilisé.

## 3. Sentry (plantages)

Le projet React Native Sentry est `nach-corp-5a/lokky`. Le DSN est configuré dans les profils
EAS. Chaque profil utilise l'environnement EAS correspondant (`development`, `preview` ou
`production`) ; ajouter `SENTRY_AUTH_TOKEN` comme variable sensible à chaque environnement
nécessitant l'envoi de source maps. L'app ne transmet aucun événement en développement (`__DEV__`).

L'envoi automatique des source maps est activé dans les profils EAS. Le jeton ne doit jamais être
ajouté au dépôt ni à une variable `EXPO_PUBLIC_…`. Après avoir enregistré le secret dans EAS,
reconstruire le profil concerné pour envoyer les source maps.

Chaque écran a son écran d'erreur illustré (« Réessayer ») : une erreur dans un écran n'arrête plus toute l'app, et elle est signalée à Sentry.

## 4. Serveur de production (VPS OVH) et admin

L'API, son worker, PostgreSQL/PostGIS, Redis et l'admin tournent sur un VPS OVH (Varsovie,
4 vCores, 8 Go, Ubuntu 26.04, IP `54.37.137.215`). Le site public reste sur Vercel.

- `https://api.lokky.app` : API et Socket.IO (Caddy → conteneur `api`).
- `https://admin.lokky.app` : admin statique ; `/api/*` y est relayé vers l'API, sur la même
  origine (cookie `SameSite=Strict`, pas de CORS, `ADMIN_WEB_ORIGIN` laissé vide).
- DNS chez Cloudflare : enregistrements `A` `api` et `admin` vers l'IP, nuage **gris**
  (DNS only) pour que Caddy obtienne et renouvelle seul les certificats Let's Encrypt.

Fichiers dans `deploy/` : `Dockerfile` (cibles `api` et `caddy`, l'admin est compilé dans
l'image Caddy), `docker-compose.yml`, `Caddyfile`, `deploy.sh`. Seul Caddy est exposé (80/443) ;
pare-feu ufw (SSH, 80, 443), SSH par clé uniquement, fail2ban, mises à jour de sécurité
automatiques, journaux Docker limités à 3 × 10 Mo par service.

**Déployer** (depuis Git Bash, à la racine du dépôt) : `bash deploy/deploy.sh`. Le script envoie
la copie de travail (fichiers suivis et nouveaux fichiers non ignorés), reconstruit les images et
redémarre ce qui a changé. Les migrations s'appliquent au démarrage de l'API.

**Secrets** : `/opt/lokky/.env` sur le serveur (droits 600, jamais dans le dépôt) : domaines,
`POSTGRES_PASSWORD` (généré sur le serveur), `JWT_PRIVATE_KEY` (générée sur le serveur),
Resend, R2. Une ligne laissée vide compte comme absente. Après modification : `bash deploy/deploy.sh`
ou `docker compose ... up -d api`.

**Commandes utiles** (sur le serveur, dans `/opt/lokky`) :

```
alias dc='docker compose --project-directory /opt/lokky -f src/deploy/docker-compose.yml'
dc ps                    # état des services
dc logs -f api           # journaux de l'API
dc exec api npx tsx scripts/staff.ts <email> admin|moderator|none
dc exec api npx tsx scripts/moderate.ts <email> <statut> [jours]
dc exec postgres psql -U lokky lokky
```

En local, `npm run dev --workspace @lokky/admin` utilise par défaut l'API de production via le
proxy Vite. Pour viser l'API locale : `LOKKY_API_URL=http://127.0.0.1:3000`.

Équipe (jamais depuis l'API ; le compte est créé s'il n'existe pas) :

- `npm run staff -w @lokky/api -- <email> admin` : administration (bannir, lever un bannissement, modérer l'équipe) ;
- `npm run staff -w @lokky/api -- <email> moderator` : signalements, avertir, suspendre, rétablir, annuler une sortie ;
- `npm run staff -w @lokky/api -- <email> none` : retire l'accès et ferme ses sessions.

Connexion par code email (le même que l'app), session de 12 heures. Chaque décision et chaque
lecture d'une conversation (chat de groupe, contexte d'un message privé signalé) est inscrite dans
la table `admin_audit`.

En local : `npm run dev -w @lokky/api` puis `LOKKY_API_URL=http://127.0.0.1:3000 npm run dev -w @lokky/admin`
→ http://localhost:5180 (Vite relaie `/api` vers l'API locale).

## 5. Site public (`apps/web`)

Le site vit dans le monorepo, est construit avec Astro et ne nécessite pas de serveur backend.
Il dépend de `@lokky/shared` (textes légaux communs avec l'app).

Sur **Vercel** :

- **Root Directory** : `apps/web` (laisser « Include files outside the root directory » activé :
  le paquet `@lokky/shared` est dans `packages/`).
- **Framework** : Astro ; **Install Command** : `cd ../.. && npm ci` ; **Build Command** :
  `npm run build` ; **Output Directory** : `dist`.
- Domaines (Settings › Domains) : `lokky.app` (principal), `www.lokky.app` (redirigé vers
  `lokky.app`) et, pendant la transition, `lokky.akylian.com` **sans redirection dans Vercel** :
  `vercel.json` le redirige lui-même vers `lokky.app`, sauf `/.well-known/*` et `/activity/*`
  (Apple et Google ne suivent pas de redirection pour vérifier les liens universels).

DNS chez **Cloudflare** (zone `lokky.app`, onglet DNS) — reprendre exactement les valeurs que
Vercel affiche pour chaque domaine :

| Type | Nom | Valeur | Proxy |
|---|---|---|---|
| A | `@` | `76.76.21.21` (ou l'IP indiquée par Vercel) | DNS only (nuage gris) |
| CNAME | `www` | `cname.vercel-dns.com` (ou la cible indiquée par Vercel) | DNS only (nuage gris) |

Le nuage doit rester **gris** : Vercel émet lui-même le certificat HTTPS, et le proxy Cloudflare
peut bloquer cette émission et la vérification des liens universels. `.app` impose HTTPS
(HSTS) : le site n'est joignable qu'une fois le certificat Vercel actif.

Adresse `contact@lokky.app` (pages légales) : Cloudflare › Email › Email Routing, créer
l'adresse `contact` et la transférer vers une boîte existante (Cloudflare ajoute ses propres
enregistrements MX et SPF).

Pages : `/` (accueil), `/confidentialite`, `/conditions`, `/suppression-compte` (URL de suppression
de compte demandée par Google Play), `/activity/:id` (§1). Les deux textes légaux viennent de
`packages/shared/src/legal/` : les modifier là met à jour l'app et le site.

Référencement (déjà dans le code) : adresse canonique sur `https://lokky.app` sans « / » final,
Open Graph et carte X avec `public/og-image.jpg` (1200×630), données structurées schema.org
(WebSite, Organization, MobileApplication) sur l'accueil, `sitemap.xml`, `robots.txt`, `noindex`
sur `/activity/:id`, favicon PNG/ICO et `apple-touch-icon`. Une fois le site en ligne :

1. **Google Search Console** › Ajouter une propriété › **Domaine** › `lokky.app`. Google donne un
   enregistrement **TXT** : l'ajouter dans Cloudflare (DNS › Add record › TXT, nom `@`), puis
   « Valider ».
2. Search Console › Sitemaps › soumettre `https://lokky.app/sitemap.xml`.
3. Vérifier l'aperçu de partage : coller `https://lokky.app` dans WhatsApp, ou utiliser le
   débogueur de partage de Facebook (il force aussi la mise à jour du cache).

## 6. Reste à faire hors code

- Surveillance : l'API expose `GET https://api.lokky.app/health` sans authentification.
  La route vérifie PostgreSQL et Redis et renvoie `200` avec `{ "ok": true, ... }` s'ils répondent,
  sinon `503`. Le worker BullMQ tourne dans le même processus que l'API. Un moniteur (UptimeRobot,
  Better Stack…) sur cette URL prévient si le serveur tombe.
- Publier les deux fichiers de liens et la page web de secours.
- Faire relire les textes légaux (`src/features/settings/legal/`) et confirmer l'adresse de contact.
- Générer les illustrations (`docs/illustrations.md`).
