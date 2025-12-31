#!/bin/bash
# PostgreSQL Backup Script for Restaurant OS
# Usage: ./backup-postgres.sh [container_name] [backup_dir]

set -e

CONTAINER_NAME=${1:-restaurant-postgres}
BACKUP_DIR=${2:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/restaurant_db_${TIMESTAMP}.sql.gz"

# Database credentials (from environment or defaults)
DB_NAME=${DATABASE_NAME:-restaurant_db}
DB_USER=${DATABASE_USERNAME:-strapi}

# Create backup directory if not exists
mkdir -p ${BACKUP_DIR}

echo "Starting backup of ${DB_NAME}..."

# Create backup using pg_dump
docker exec ${CONTAINER_NAME} pg_dump \
  -U ${DB_USER} \
  -d ${DB_NAME} \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > ${BACKUP_FILE}

# Verify backup file exists and has content
if [ -s "${BACKUP_FILE}" ]; then
  echo "Backup created successfully: ${BACKUP_FILE}"
  echo "Size: $(du -h ${BACKUP_FILE} | cut -f1)"
else
  echo "ERROR: Backup file is empty or not created!"
  exit 1
fi

# Keep only last 7 days of backups
echo "Cleaning up old backups..."
find ${BACKUP_DIR} -name "restaurant_db_*.sql.gz" -mtime +7 -delete

# List remaining backups
echo "Remaining backups:"
ls -lh ${BACKUP_DIR}/restaurant_db_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup completed successfully!"
