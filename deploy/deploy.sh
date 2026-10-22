#!/usr/bin/env bash
# Déploie la copie de travail actuelle (fichiers suivis par git + nouveaux fichiers non ignorés)
# sur le VPS, puis reconstruit et redémarre les services. À lancer depuis Git Bash :
#   bash deploy/deploy.sh
set -euo pipefail

SERVER="${LOKKY_SERVER:-ubuntu@54.37.137.215}"
DIR=/opt/lokky

cd "$(dirname "$0")/.."

# Seulement ce qu'il faut pour construire l'API et l'admin.
git ls-files -z --cached --others --exclude-standard -- \
  package.json package-lock.json .dockerignore '*/package.json' packages/shared apps/api apps/admin deploy \
  | tar --null -T - -czf - \
  | ssh "$SERVER" "set -e
      rm -rf $DIR/src.new && mkdir -p $DIR/src.new
      tar -xzf - -C $DIR/src.new
      rm -rf $DIR/src && mv $DIR/src.new $DIR/src"

ssh "$SERVER" "set -e
  cd $DIR
  docker compose --project-directory $DIR -f src/deploy/docker-compose.yml up -d --build --remove-orphans
  docker image prune -f >/dev/null
  docker compose --project-directory $DIR -f src/deploy/docker-compose.yml ps"
