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

echo "[3/4] Démarrage du serveur de développement"

echo "[4/4] Redémarrage PM2"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 delete "$PM2_NAME"
fi

pm2 start npm --name "$PM2_NAME" -- run dev -- --host "$HOST" --port "$PORT"

pm2 save

SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -z "${SERVER_IP:-}" ]; then
  SERVER_IP="$HOST"
fi

echo ""
echo "Déploiement terminé en mode développement."
echo "Port: $PORT"
echo "URL locale: http://127.0.0.1:$PORT"
echo "URL réseau: http://${SERVER_IP}:$PORT"
