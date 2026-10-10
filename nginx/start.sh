#!/bin/sh
set -e

echo "Waiting for web and api containers to be resolvable..."
MAX_WAIT=30
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
  if getent hosts web > /dev/null 2>&1 && getent hosts api > /dev/null 2>&1; then
    echo "web and api are resolvable"
    break
  fi
  echo "Waiting... ($WAITED/$MAX_WAIT)"
  sleep 1
  WAITED=$((WAITED + 1))
done

if [ $WAITED -ge $MAX_WAIT ]; then
  echo "ERROR: web or api not resolvable after ${MAX_WAIT}s"
  exit 1
fi

exec /docker-entrypoint.sh nginx -g 'daemon off;'
