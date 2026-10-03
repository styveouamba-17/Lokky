# Lokky — Mise en production (jalon 8)

Ce qui est prêt dans l'app, et ce qu'il reste à faire **en dehors du code** pour que notifications, liens et suivi des plantages fonctionnent en vrai.

## 0. Nouveau build de développement

Le jalon 8 ajoute un module natif (`react-native-keyboard-controller`, clavier du chat). Le build de développement actuel ne le contient pas :

```bash
cd apps/mobile
npx eas-cli@latest build --profile development --platform all
```

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

Sans l'app installée, le lien ouvre le site : prévois une page `/activity/:id` qui présente Lokky avec les liens App Store et Google Play.

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

L'app n'envoie rien tant qu'aucun DSN n'est configuré, et jamais en développement.

1. Créer le projet React Native dans Sentry.
2. Ajouter le DSN dans `eas.json` (profils `preview` et `production`) : `"EXPO_PUBLIC_SENTRY_DSN": "https://…@….ingest.sentry.io/…"`.
3. Pour des piles d'appels lisibles (source maps) :
   - renseigner l'organisation et le projet dans `app.config.ts` : `['@sentry/react-native/expo', { organization: '…', project: '…' }]` ;
   - créer le secret EAS `SENTRY_AUTH_TOKEN` (visibilité « sensitive ») ;
   - retirer `SENTRY_DISABLE_AUTO_UPLOAD` de `eas.json`.

Chaque écran a son écran d'erreur illustré (« Réessayer ») : une erreur dans un écran n'arrête plus toute l'app, et elle est signalée à Sentry.

## 4. Reste à faire hors code

- Publier les deux fichiers de liens et la page web de secours.
- Brancher le vrai backend (contrat `@lokky/shared`) : `EXPO_PUBLIC_API_MODE=http` et `EXPO_PUBLIC_API_URL`.
- Faire relire les textes légaux (`src/features/settings/legal/`) et confirmer l'adresse de contact.
- Générer les illustrations (`docs/illustrations.md`).
