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

## 1. Liens vers une sortie (`lokky.akylian.com/activity/:id`)

L'app est configurée (`app.config.ts` : `associatedDomains` iOS, `intentFilters` Android). Il reste à publier **deux fichiers** sur `https://lokky.akylian.com`, en HTTPS, avec le type `application/json` et sans redirection.

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

L'empreinte s'obtient avec `npx eas-cli@latest credentials -p android` (certificat de signature de production). Si l'app est distribuée par Google Play, ajoute aussi l'empreinte « App signing key » de la Play Console.

### Page web de secours

Le site public `apps/web` présente Lokky et est généré en statique par Astro (`npm run build --workspace @lokky/web` → `apps/web/dist`). Il peut être publié sur un hébergeur statique depuis le monorepo.

La page d'accueil est en place, mais la page de secours propre à chaque lien (`/activity/:id`) reste à créer : elle devra présenter la sortie et les liens App Store et Google Play lorsque ceux-ci seront disponibles.

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

L'admin est une application web statique (`npm run build -w @lokky/admin` → `apps/admin/dist`).
Elle appelle l'API **sur sa propre origine**, sous `/api` : le cookie de session est `HttpOnly`,
`SameSite=Strict` et `Secure` en production, et chaque requête porte l'en-tête `x-lokky-admin: 1`
(protection CSRF). Pas de CORS à ouvrir.

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

Le site vit dans le monorepo, est construit avec Astro et ne nécessite pas de serveur backend :
`npm run build --workspace @lokky/web` produit les fichiers statiques dans `apps/web/dist`.
Publier ce dossier sur un hébergeur statique et associer le domaine public. Il partage le domaine
prévu pour les liens `lokky.akylian.com`; les pages `/activity/:id` de secours ne sont pas encore
implémentées.

## 6. Reste à faire hors code

- Publier les deux fichiers de liens et la page web de secours.
- Faire relire les textes légaux (`src/features/settings/legal/`) et confirmer l'adresse de contact.
- Générer les illustrations (`docs/illustrations.md`).
