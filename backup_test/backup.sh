#!/bin/bash
# Backup script for taskflow_db MySQL database
# Run this from the backup_test directory

# Load env variables from root .env if it exists
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep db | head -n 1)
# Fallback container name if the above fails
if [ -z "$CONTAINER_NAME" ]; then
  CONTAINER_NAME="taskflow-api-db-1"
fi

DB_USER=${DB_USER:-"root"}
DB_PASSWORD=${MYSQL_ROOT_PASSWORD:-"rootpassword"}
DB_NAME=${DB_NAME:-"taskflow_db"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting backup of ${DB_NAME} from container ${CONTAINER_NAME}..."
docker exec ${CONTAINER_NAME} /usr/bin/mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "Backup successful! File saved to: ${BACKUP_FILE}"
else
  echo "Backup failed!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi
