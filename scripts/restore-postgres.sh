#!/bin/bash
# PostgreSQL Restore Script for Restaurant OS
# Usage: ./restore-postgres.sh <backup_file> [container_name]

set -e

BACKUP_FILE=$1
CONTAINER_NAME=${2:-restaurant-postgres}

# Database credentials (from environment or defaults)
DB_NAME=${DATABASE_NAME:-restaurant_db}
DB_USER=${DATABASE_USERNAME:-strapi}

# Validate backup file
if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: ./restore-postgres.sh <backup_file> [container_name]"
  echo ""
  echo "Available backups:"
  ls -lh ./backups/restaurant_db_*.sql.gz 2>/dev/null || echo "No backups found in ./backups/"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "WARNING: This will restore the database from ${BACKUP_FILE}"
echo "All current data in ${DB_NAME} will be REPLACED!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Starting restore..."

# Drop and recreate database
echo "Dropping existing database..."
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

# Restore from backup
echo "Restoring from backup..."
gunzip -c ${BACKUP_FILE} | docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}

echo "Restore completed successfully!"
echo ""
echo "IMPORTANT: Restart Strapi to apply changes:"
echo "  docker-compose restart strapi"
