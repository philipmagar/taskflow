#!/bin/bash
# Restore script for taskflow_db MySQL database
# Usage: ./restore.sh <backup_file_path>

if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_backup_file.sql>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' does not exist."
  exit 1
fi

# Load env variables from root .env if it exists
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep db | head -n 1)
if [ -z "$CONTAINER_NAME" ]; then
  CONTAINER_NAME="taskflow-api-db-1"
fi

DB_USER=${DB_USER:-"root"}
DB_PASSWORD=${MYSQL_ROOT_PASSWORD:-"rootpassword"}
DB_NAME=${DB_NAME:-"taskflow_db"}

echo "Starting restore of ${DB_NAME} from ${BACKUP_FILE} to container ${CONTAINER_NAME}..."
cat "${BACKUP_FILE}" | docker exec -i ${CONTAINER_NAME} /usr/bin/mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME}

if [ $? -eq 0 ]; then
  echo "Restore completed successfully!"
else
  echo "Restore failed!"
  exit 1
fi
