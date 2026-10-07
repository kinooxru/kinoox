#!/usr/bin/env bash
set -e

cd /opt/kinoox
cp .env.example .env

echo "=== Generating secrets ==="
DB_PASSWORD=$(openssl rand -base64 48)
JWT_ACCESS_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 48)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 48)

echo "=== Updating .env ==="
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env
sed -i "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET|" .env
sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
sed -i "s|MINIO_ROOT_PASSWORD=.*|MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD|" .env
sed -i "s|GRAFANA_ADMIN_PASSWORD=.*|GRAFANA_ADMIN_PASSWORD=$GRAFANA_ADMIN_PASSWORD|" .env

echo "=== Verifying ==="
grep "^DB_PASSWORD=" .env
grep "^JWT_ACCESS_SECRET=" .env
grep "^JWT_REFRESH_SECRET=" .env
grep "^MINIO_ROOT_PASSWORD=" .env
grep "^GRAFANA_ADMIN_PASSWORD=" .env

echo "=== .env created successfully ==="
