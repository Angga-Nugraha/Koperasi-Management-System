#!/bin/bash
# ============================================
# SIMKO — Database Backup Script
# Usage: ./scripts/backup-db.sh [output-dir]
# Default output: ./backups/
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  source "$PROJECT_DIR/.env"
elif [ -f "$PROJECT_DIR/.env.local" ]; then
  source "$PROJECT_DIR/.env.local"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set. Create a .env file or export it."
  exit 1
fi

OUTPUT_DIR="${1:-$PROJECT_DIR/backups}"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$OUTPUT_DIR/simko_${TIMESTAMP}.sql"

echo "Backing up database to: $BACKUP_FILE"

# Parse DATABASE_URL
# mysql://user:password@host:port/database
REGEX='mysql://([^:]+):([^@]+)@([^:]+):?([0-9]*)/(.+)'
if [[ $DATABASE_URL =~ $REGEX ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]:-3306}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "ERROR: Could not parse DATABASE_URL. Expected format: mysql://user:pass@host:port/db"
  exit 1
fi

# Run mysqldump
MYSQLDUMP_OPTS="--single-transaction --routines --triggers --add-drop-table"

if command -v mysqldump &> /dev/null; then
  MYSQL_PWD="$DB_PASS" mysqldump $MYSQLDUMP_OPTS \
    -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
    "$DB_NAME" > "$BACKUP_FILE"
else
  echo "ERROR: mysqldump not found. Install mysql-client package."
  exit 1
fi

# Compress
gzip "$BACKUP_FILE"
echo "Done: ${BACKUP_FILE}.gz ($(du -h "${BACKUP_FILE}.gz" | cut -f1))"

# Cleanup backups older than 30 days
find "$OUTPUT_DIR" -name "simko_*.sql.gz" -mtime +30 -delete

echo "Backup complete."
