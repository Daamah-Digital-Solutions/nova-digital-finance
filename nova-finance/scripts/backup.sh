#!/bin/bash

# Nova Finance Backup Script
# Automated backup of database, media files, and configurations

set -e

# Configuration
BACKUP_DIR="/backups/nova-finance"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="nova_backup_$DATE"
CURRENT_BACKUP="$BACKUP_DIR/$BACKUP_NAME"
RETENTION_DAYS=30
LOG_FILE="/var/log/nova-finance/backup.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

# Create backup directory
log "Starting Nova Finance backup: $BACKUP_NAME"
mkdir -p "$CURRENT_BACKUP"

# Load environment variables
if [ -f "/opt/nova-finance/.env" ]; then
    source /opt/nova-finance/.env
else
    error_exit "Environment file not found"
fi

# Backup database
log "Backing up PostgreSQL database..."
if docker-compose -f /opt/nova-finance/docker-compose.yml exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$CURRENT_BACKUP/database.sql"; then
    success "Database backup completed"
else
    error_exit "Database backup failed"
fi

# Backup media files
if [ -d "/opt/nova-finance/media" ]; then
    log "Backing up media files..."
    if cp -r /opt/nova-finance/media "$CURRENT_BACKUP/"; then
        success "Media files backup completed"
    else
        error_exit "Media files backup failed"
    fi
fi

# Backup configuration files
log "Backing up configuration files..."
mkdir -p "$CURRENT_BACKUP/config"
cp /opt/nova-finance/.env "$CURRENT_BACKUP/config/" 2>/dev/null || true
cp /opt/nova-finance/docker-compose.yml "$CURRENT_BACKUP/config/"
cp -r /opt/nova-finance/nginx "$CURRENT_BACKUP/config/" 2>/dev/null || true
cp -r /opt/nova-finance/ssl "$CURRENT_BACKUP/config/" 2>/dev/null || true
success "Configuration files backup completed"

# Backup logs (last 7 days)
log "Backing up recent logs..."
mkdir -p "$CURRENT_BACKUP/logs"
find /var/log/nova-finance -name "*.log" -mtime -7 -exec cp {} "$CURRENT_BACKUP/logs/" \; 2>/dev/null || true
success "Logs backup completed"

# Create backup metadata
log "Creating backup metadata..."
cat > "$CURRENT_BACKUP/backup_info.txt" << EOF
Nova Finance Backup Information
===============================
Backup Date: $(date)
Backup Name: $BACKUP_NAME
Database: $DB_NAME
Server: $(hostname)
Docker Compose Status:
$(docker-compose -f /opt/nova-finance/docker-compose.yml ps)

Disk Usage:
$(df -h)

System Info:
$(uname -a)
$(lsb_release -a 2>/dev/null || echo "OS info not available")
EOF

# Calculate backup size
BACKUP_SIZE=$(du -sh "$CURRENT_BACKUP" | cut -f1)
log "Backup size: $BACKUP_SIZE"

# Compress backup
log "Compressing backup..."
cd "$BACKUP_DIR"
if tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"; then
    rm -rf "$CURRENT_BACKUP"
    success "Backup compressed successfully"
else
    error_exit "Backup compression failed"
fi

# Verify backup integrity
log "Verifying backup integrity..."
if tar -tzf "$BACKUP_NAME.tar.gz" >/dev/null; then
    success "Backup integrity verified"
else
    error_exit "Backup integrity check failed"
fi

# Upload to cloud storage (AWS S3 example)
if [ -n "$AWS_STORAGE_BUCKET_NAME" ] && command -v aws &> /dev/null; then
    log "Uploading backup to AWS S3..."
    if aws s3 cp "$BACKUP_NAME.tar.gz" "s3://$AWS_STORAGE_BUCKET_NAME/backups/"; then
        success "Backup uploaded to S3"
    else
        log "${YELLOW}WARNING: S3 upload failed${NC}"
    fi
fi

# Clean up old backups
log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "nova_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
OLD_COUNT=$(find "$BACKUP_DIR" -name "nova_backup_*.tar.gz" -mtime +$RETENTION_DAYS | wc -l)
success "Cleaned up old backups"

# Send notification
FINAL_SIZE=$(ls -lh "$BACKUP_NAME.tar.gz" | awk '{print $5}')
log "Backup completed successfully!"
log "Final backup file: $BACKUP_NAME.tar.gz ($FINAL_SIZE)"

# Optional: Send email notification
if command -v mail &> /dev/null && [ -n "$BACKUP_NOTIFICATION_EMAIL" ]; then
    echo "Nova Finance backup completed successfully.
    
Backup Details:
- Name: $BACKUP_NAME.tar.gz
- Size: $FINAL_SIZE
- Location: $BACKUP_DIR
- Date: $(date)

Components backed up:
- PostgreSQL database
- Media files
- Configuration files
- Recent logs

Status: SUCCESS" | mail -s "Nova Finance Backup Completed - $DATE" "$BACKUP_NOTIFICATION_EMAIL"
fi

success "Backup process completed successfully!"
log "Backup location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"