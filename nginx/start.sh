#!/bin/sh
set -e

echo "Waiting for web and api containers to be reachable..."
MAX_WAIT=30
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
  if wget -q --spider http://api:3001/api/health 2>/dev/null; then
    echo "api is reachable"
    break
  fi
  echo "Waiting... ($WAITED/$MAX_WAIT)"
  sleep 1
  WAITED=$((WAITED + 1))
done

if [ $WAITED -ge $MAX_WAIT ]; then
  echo "ERROR: api not reachable after ${MAX_WAIT}s"
  exit 1
fi

exec /docker-entrypoint.sh nginx -g 'daemon off;'
