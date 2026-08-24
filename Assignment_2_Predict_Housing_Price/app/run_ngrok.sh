#!/usr/bin/env bash
# Starts the ValuAI backend, exposes it via ngrok, points the frontend .env
# at the tunnel URL, and rebuilds + syncs the Capacitor iOS project so the
# app on a physical iPhone can reach the backend over the internet.
#
# Usage: ./run_ngrok.sh [backend_port]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PORT="${1:-8002}"

command -v ngrok >/dev/null || { echo "ngrok not found on PATH. Install it first: brew install ngrok"; exit 1; }

echo "==> Checking backend on port $PORT"
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/health" | grep -q "200"; then
  echo "    already running"
else
  echo "    starting backend..."
  (cd "$BACKEND_DIR" && PORT="$PORT" nohup node server.js > /tmp/valuai_backend.log 2>&1 &)
  for i in $(seq 1 20); do
    sleep 1
    curl -s -o /dev/null -w "" "http://localhost:$PORT/api/health" 2>/dev/null && break
  done
  curl -sf "http://localhost:$PORT/api/health" >/dev/null || { echo "Backend failed to start. See /tmp/valuai_backend.log"; exit 1; }
  echo "    backend ready"
fi

echo "==> Starting ngrok tunnel -> :$PORT"
pkill -f "ngrok http $PORT" 2>/dev/null || true
sleep 1
nohup ngrok http "$PORT" --log=stdout > /tmp/ngrok_valuai.log 2>&1 &

PUBLIC_URL=""
for i in $(seq 1 20); do
  sleep 1
  PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; d=json.load(sys.stdin); t=[x for x in d['tunnels'] if x['config']['addr'].endswith(':$PORT')]; print(t[0]['public_url'] if t else '')" 2>/dev/null || true)
  [ -n "$PUBLIC_URL" ] && break
done
[ -n "$PUBLIC_URL" ] || { echo "Could not get ngrok public URL. See /tmp/ngrok_valuai.log"; exit 1; }
echo "    tunnel: $PUBLIC_URL"

echo "==> Writing $FRONTEND_DIR/.env"
echo "VITE_API_BASE=$PUBLIC_URL/api" > "$FRONTEND_DIR/.env"

echo "==> Building frontend + syncing iOS"
(cd "$FRONTEND_DIR" && npm run build && npx cap sync ios)

echo ""
echo "Done. Backend on :$PORT, tunnel: $PUBLIC_URL"
echo "Open Xcode and re-run the app on your iPhone to pick up the new build."
