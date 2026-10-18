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

## 4. Admin de modération (`apps/admin`)

L'admin est une application web statique. Pour la publier sur Render Static Site :

- **Build command** (depuis la racine du monorepo) : `npm ci && npm run build --workspace @lokky/admin`
- **Publish directory** : `apps/admin/dist` (ne pas publier `apps/admin` lui-même ni son dossier source).
- Ajouter `VITE_API_URL=https://lokky.onrender.com` aux variables de build du site statique.
- Ajouter `ADMIN_WEB_ORIGIN=https://<domaine-exact-du-site-admin>` aux variables du backend Render,
  puis redéployer le backend. Cette origine unique est autorisée en CORS pour les routes admin ;
  les cookies de session sont envoyés avec les requêtes (`HttpOnly`, `Secure`, `SameSite=None`)
  et les requêtes gardent l'en-tête CSRF `x-lokky-admin: 1`.

En local, `npm run dev --workspace @lokky/admin` utilise par défaut le backend Render via le proxy
Vite, sans configuration CORS dans le navigateur. Pour viser un autre backend, définir
`LOKKY_API_URL` avant de démarrer Vite (par exemple `http://127.0.0.1:3000`).

Le déploiement doit servir les fichiers compilés de `apps/admin/dist`. Servir `index.html` depuis
le code source ou ouvrir le fichier directement peut faire demander `/src/main.tsx` au serveur ;
celui-ci renvoie alors du HTML au lieu d'un module JavaScript et le navigateur affiche l'erreur
de type MIME.

Caddy (domaine à adapter) :

```
admin.<domaine> {
	handle_path /api/* {
		reverse_proxy api:3000
	}
	handle {
		root * /srv/admin
		try_files {path} /index.html
		file_server
	}
	header X-Robots-Tag "noindex, nofollow"
}
```

Équipe (jamais depuis l'API ; le compte est créé s'il n'existe pas) :

- `npm run staff -w @lokky/api -- <email> admin` : administration (bannir, lever un bannissement, modérer l'équipe) ;
- `npm run staff -w @lokky/api -- <email> moderator` : signalements, avertir, suspendre, rétablir, annuler une sortie ;
- `npm run staff -w @lokky/api -- <email> none` : retire l'accès et ferme ses sessions.

Connexion par code email (le même que l'app), session de 12 heures. Chaque décision et chaque
lecture d'une conversation (chat de groupe, contexte d'un message privé signalé) est inscrite dans
la table `admin_audit`.

En local : `npm run dev -w @lokky/api` puis `npm run dev -w @lokky/admin` → http://localhost:5180
(Vite relaie `/api` vers l'API sur le port 3000).

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

- Surveillance Render : l'API expose `GET https://lokky.onrender.com/health` sans authentification.
  La route vérifie PostgreSQL et Redis et renvoie `200` avec `{ "ok": true, ... }` s'ils répondent,
  sinon `503`. Le worker BullMQ démarre désormais dans le même processus que l'API : aucun service
  Background Worker Render séparé n'est requis. Sur l'offre gratuite, le Web Service peut toutefois
  s'endormir après une période sans trafic ; le traitement des tâches et l'envoi des push peuvent
  donc être retardés jusqu'à son réveil. Un moniteur UptimeRobot sur cette URL peut générer du
  trafic régulier, sans garantir une disponibilité continue.
- Publier les deux fichiers de liens et la page web de secours.
- Faire relire les textes légaux (`src/features/settings/legal/`) et confirmer l'adresse de contact.
- Générer les illustrations (`docs/illustrations.md`).
