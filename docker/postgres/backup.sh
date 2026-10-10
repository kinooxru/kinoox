#!/bin/bash
set -e

echo "=== KINOOX PostgreSQL Backup ==="
echo "Start: $(date)"

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M)
BACKUP_FILE="${BACKUP_DIR}/kinoox_${TIMESTAMP}.dump"

# Создаём дамп
pg_dump -Fc \
  -h "${PGHOST:-postgres}" \
  -U "${PGUSER:-kinoox}" \
  -d "${PGDATABASE:-kinoox_db}" \
  -f "${BACKUP_FILE}"

echo "Backup created: ${BACKUP_FILE}"

# Удаляем старые бэкапы
find "${BACKUP_DIR}" -name "*.dump" -mtime +"${RETENTION_DAYS:-30}" -delete

echo "Old backups cleaned"
echo "End: $(date)"
