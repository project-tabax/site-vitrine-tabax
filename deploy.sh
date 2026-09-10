#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-4173}"
PM2_NAME="${PM2_NAME:-tabax-react}"
HOST="${HOST:-0.0.0.0}"

cd "$APP_DIR"

for command_name in git npm pm2; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Erreur: $command_name est introuvable sur le serveur."
    exit 1
  fi
done

echo "[1/4] Mise à jour du dépôt"
git pull --ff-only

echo "[2/4] Installation des dépendances"
npm install

echo "[3/4] Build de production"
npm run build

echo "[4/4] (Re)démarrage PM2 — service statique de dist/"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 delete "$PM2_NAME"
fi

# Sert le build statique dist/ (SPA : fallback index.html) via `npx serve`.
pm2 start npx --name "$PM2_NAME" -- serve -s dist -l "$PORT"

pm2 save

SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -z "${SERVER_IP:-}" ]; then
  SERVER_IP="$HOST"
fi

echo ""
echo "Déploiement terminé (build de production servi depuis dist/)."
echo "Port: $PORT"
echo "URL locale: http://127.0.0.1:$PORT"
echo "URL réseau: http://${SERVER_IP}:$PORT"
