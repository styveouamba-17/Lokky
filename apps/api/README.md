# @lokky/api

Backend de Lokky : implémente le contrat `@lokky/shared` (spec : `docs/superpowers/specs/2026-10-03-lokky-backend-design.md`).

## Démarrer en local

Prérequis : Node 24, Docker Desktop.

```bash
cd apps/api
cp .env.example .env      # une seule fois
npm run keys:jwt          # une seule fois : coller la ligne affichée dans .env
npm run db:up             # PostgreSQL (PostGIS) sur 5434, Redis sur 6380
npm run db:migrate
npm run db:seed           # facultatif : personnes et sorties de démo (relançable)
npm run dev               # http://localhost:3000/health (API + Socket.IO + worker BullMQ)
```

Le worker BullMQ démarre avec l'API. `npm run worker` reste disponible pour le lancer séparément.

Les ports sont décalés pour ne pas gêner un PostgreSQL ou un Redis déjà installés (5432, 5433, 6379). Pour en changer : `POSTGRES_PORT` / `REDIS_PORT` et les URL dans `.env`.

## Tests

```bash
npm run db:up
npm test                  # base lokky_test, migrations appliquées automatiquement
```

## Migrations

Modifier `src/db/schema.ts`, puis `npm run db:generate`, relire le SQL généré dans `src/db/migrations/`, et `npm run db:migrate`.
Avant de déployer une version de l'API qui dépend d'une nouvelle migration, exécuter
`npm run db:migrate --workspace @lokky/api` dans l'environnement de déploiement, avec
`DATABASE_URL` pointant vers la base cible. Ne pas basculer l'API sur le nouveau code avant la
réussite de la migration.

## Connexion en local

Sans `RESEND_API_KEY`, aucun email ne part : le code de connexion s'affiche dans le terminal du serveur. Sans les variables `R2_*`, l'envoi de photo répond 503 (le reste fonctionne).

## Modération (en attendant l'admin)

```bash
npm run moderate -- awa@exemple.sn suspended 7 "Propos insultants"
npm run moderate -- awa@exemple.sn active
```

La personne est prévenue tout de suite dans l'app (si l'API tourne).

## Notifications push

Le worker envoie par le service Expo. Les nouvelles sorties sont proposées aux personnes dont les centres d’intérêt comprennent la catégorie (sans filtre géographique), en respectant leur préférence « Sorties et découvertes ». Pour qu'elles arrivent, l'app doit tourner sur un vrai téléphone (build de développement), avec les identifiants push configurés dans EAS (FCM pour Android, APNs pour iOS).
