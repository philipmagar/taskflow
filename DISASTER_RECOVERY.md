# TaskFlow API - Disaster Recovery Document

This document outlines the procedures for backing up and restoring the TaskFlow API database, as well as the steps to take in the event of a critical failure or data loss.

## 1. Overview

The TaskFlow API relies on a MySQL database (running via Docker) for persistent storage. Data is stored in a Docker volume named `db_data`. In a disaster recovery scenario (e.g., database corruption, accidental deletion, or container loss), having automated backups ensures that data can be restored with minimal downtime.

## 2. Backup Procedures

### Automated Backups
Database backups are automated using a `cron` job that executes a shell script (`backup_test/backup.sh`). This script dumps the database contents into an `.sql` file inside the `backup_test/backups/` directory.

- **Backup Script Location**: `backup_test/backup.sh`
- **Output Location**: `backup_test/backups/taskflow_db_YYYYMMDD_HHMMSS.sql`
- **Cron Configuration**: (See `backup_test/cron_setup.txt` for setup details). Example:
  ```cron
  0 2 * * * cd /path/to/taskflow-api/backup_test && ./backup.sh >> ./backups/backup.log 2>&1
  ```

### Manual Backup
To manually trigger a backup at any time, run:
```bash
cd backup_test
chmod +x backup.sh
./backup.sh
```

## 3. Restore Procedures

If data is lost or corrupted, you can restore from the most recent `.sql` backup file.

### Prerequisites
1. Ensure the MySQL container is running (`docker-compose ps`).
2. Identify the correct backup file from the `backup_test/backups/` directory.

### Running the Restore
Use the provided `restore.sh` script to restore the database:

```bash
cd backup_test
chmod +x restore.sh
./restore.sh backups/taskflow_db_YYYYMMDD_HHMMSS.sql
```

### Manual Restore (Without Script)
If you prefer or if the script is unavailable, you can manually restore the database using the Docker command line:
```bash
cat backup_test/backups/taskflow_db_YYYYMMDD_HHMMSS.sql | docker exec -i taskflow-api-db-1 /usr/bin/mysql -u root -prootpassword taskflow_db
```

## 4. Disaster Scenarios & Recovery Steps

### Scenario A: Accidental Data Deletion
1. Stop any services writing to the database to prevent further corruption.
2. Locate the most recent backup in `backup_test/backups/`.
3. Execute the `restore.sh` script with the target backup file.
4. Verify the integrity of the restored data.

### Scenario B: Database Container Will Not Start
1. Check container logs for errors: `docker logs taskflow-api-db-1`.
2. If the data volume (`db_data`) is corrupted:
   - Bring down the services: `docker-compose down`
   - Remove the corrupted volume (Caution: This deletes all current DB data!): `docker volume rm taskflow-api_db_data`
   - Restart the database service: `docker-compose up -d db`
   - Run the `restore.sh` script using the most recent `.sql` backup.

### Scenario C: Complete Host Failure
1. Provision a new host machine.
2. Clone the repository and configure `.env`.
3. Copy the existing backups from remote storage (if configured) or the failed host's disk.
4. Start the application stack: `docker-compose up -d`.
5. Execute the `restore.sh` script with your latest `.sql` backup.

## 5. Best Practices & Recommendations

- **Off-Site Storage**: Currently, backups are stored on the same disk. It is strongly recommended to configure a cron job to sync the `backup_test/backups/` folder to an off-site location (e.g., AWS S3, Google Cloud Storage, or another server) using `rsync` or the `aws-cli`.
- **Retention Policy**: Implement a cleanup script to delete backups older than 7 or 30 days to prevent disk space exhaustion.
- **Regular Testing**: Periodically perform test restorations in a staging environment to ensure backups are valid and the restore procedure works as expected.
