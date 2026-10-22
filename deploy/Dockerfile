# Images de production du VPS, construites depuis la racine du monorepo (voir docker-compose.yml).
# Cible « api » : backend Fastify + worker des tâches. Cible « caddy » : HTTPS, proxy et admin statique.

FROM node:24-slim AS workspace
WORKDIR /app
# Manifestes seuls d'abord : l'installation reste en cache tant qu'ils ne changent pas.
# Tous les espaces de travail sont copiés pour que npm ci retrouve le lockfile tel quel.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/
COPY apps/web/package.json apps/web/
COPY apps/social/package.json apps/social/

FROM workspace AS api
ENV NODE_ENV=production
# Dépendances de développement gardées : tsx sert aux scripts d'exploitation (staff, moderate).
RUN npm ci --workspace @lokky/api --workspace @lokky/shared --include=dev --ignore-scripts \
  && npm cache clean --force
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @lokky/api
WORKDIR /app/apps/api
USER node
EXPOSE 3000
# Migrations appliquées à chaque démarrage (idempotentes), puis le serveur.
CMD ["sh", "-c", "node dist/db/migrate.js && exec node dist/main.js"]

FROM workspace AS admin-build
RUN npm ci --workspace @lokky/admin --workspace @lokky/shared --include=dev --ignore-scripts
COPY packages/shared packages/shared
COPY apps/admin apps/admin
# Sans VITE_API_URL, l'admin appelle /api sur sa propre origine (relayé par Caddy).
RUN npm run build --workspace @lokky/admin

FROM caddy:2-alpine AS caddy
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=admin-build /app/apps/admin/dist /srv/admin
