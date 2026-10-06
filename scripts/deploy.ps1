# ─────────────────────────────────────────────────────────────
#  KINOOX.RU — Deploy Script
#  Server: root@95.216.97.185
# ─────────────────────────────────────────────────────────────

set -e

SERVER="root@95.216.97.185"
SERVER_PATH="/opt/kinoox"
SSH_KEY="${HOME}/.ssh/id_ed25519"
PASSWORD="T4ML_EWLL_3hUp"

echo "=== KINOOX Deployment Script ==="
echo "Server: ${SERVER}"
echo "Path: ${SERVER_PATH}"
echo ""

# ── Step 1: Upload fixed docker-compose.yml ──────────────────
echo "[1/6] Uploading docker-compose.yml..."
scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  docker/docker-compose.yml ${SERVER}:${SERVER_PATH}/docker/docker-compose.yml

# ── Step 2: Upload qr/route.ts ───────────────────────────────
echo "[2/6] Uploading qr/route.ts..."
scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  apps/web/src/app/api/qr/route.ts ${SERVER}:${SERVER_PATH}/apps/web/src/app/api/qr/route.ts

# ── Step 3: Upload qr.ts ────────────────────────────────────
echo "[3/6] Uploading qr.ts..."
scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  apps/web/src/app/api/qr/qr.ts ${SERVER}:${SERVER_PATH}/apps/web/src/app/api/qr/qr.ts

# ── Step 4: Upload download-file.routes.ts ──────────────────
echo "[4/6] Uploading download-file.routes.ts..."
scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  apps/api/src/modules/downloads/download-file.routes.ts ${SERVER}:${SERVER_PATH}/apps/api/src/modules/downloads/download-file.routes.ts

# ── Step 5: Verify .env exists on server ────────────────────
echo "[5/6] Checking .env on server..."
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${SERVER} "test -f ${SERVER_PATH}/.env && echo '.env exists' || (echo '.env NOT FOUND!' && exit 1)"

# ── Step 6: Restart services ────────────────────────────────
echo "[6/6] Restarting Docker services..."
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${SERVER} "
  cd ${SERVER_PATH}/docker &&
  docker compose down &&
  docker compose up -d --build &&
  echo '=== Deployment Complete ===' &&
  docker compose ps
"

echo ""
echo "=== All steps completed ==="
