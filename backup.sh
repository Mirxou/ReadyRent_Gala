#!/bin/bash
# ============================================
# RENTILY PRODUCTION BACKUP SCRIPT
# ============================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
DB_CONTAINER="rentily_db_prod"

mkdir -p $BACKUP_DIR

echo "💾 Starting Database Backup..."

docker exec $DB_CONTAINER pg_dump -U rentily_admin rentily_production > $BACKUP_DIR/backup_$TIMESTAMP.sql

echo "🗜️ Compressing Backup..."
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

echo "🧹 Rotating Backups (keeping last 7 days)..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "✅ BACKUP COMPLETE: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
