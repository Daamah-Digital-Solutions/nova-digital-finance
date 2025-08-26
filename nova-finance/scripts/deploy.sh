#!/bin/bash

# Nova Finance Production Deployment Script
# This script handles the complete deployment process with safety checks

set -e  # Exit on any error

# Configuration
PROJECT_NAME="nova-finance"
DOCKER_COMPOSE_FILE="docker-compose.yml"
DOCKER_COMPOSE_PROD_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="/backups/nova-finance"
LOG_FILE="/var/log/nova-finance-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        error_exit "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error_exit "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error_exit "Docker daemon is not running"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error_exit "Docker Compose is not installed"
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        error_exit "Environment file $ENV_FILE not found. Please copy .env.example to .env and configure it."
    fi
    
    success "All prerequisites met"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
    CURRENT_BACKUP="$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
    
    # Backup database
    if docker-compose ps | grep -q postgres; then
        log "Backing up database..."
        docker-compose exec -T postgres pg_dump -U nova_user nova_finance > "$CURRENT_BACKUP/database_backup.sql"
        success "Database backup created"
    fi
    
    # Backup media files
    if [ -d "./media" ]; then
        log "Backing up media files..."
        sudo cp -r ./media "$CURRENT_BACKUP/"
        success "Media files backup created"
    fi
    
    success "Backup created at $CURRENT_BACKUP"
}

# Security checks
security_checks() {
    log "Running security checks..."
    
    # Check environment variables
    source "$ENV_FILE"
    
    if [ "$DEBUG" = "true" ]; then
        error_exit "DEBUG should be set to false in production"
    fi
    
    if [ -z "$SECRET_KEY" ] || [ ${#SECRET_KEY} -lt 50 ]; then
        error_exit "SECRET_KEY must be set and at least 50 characters long"
    fi
    
    if [ -z "$DB_PASSWORD" ] || [ ${#DB_PASSWORD} -lt 12 ]; then
        error_exit "DB_PASSWORD must be set and at least 12 characters long"
    fi
    
    # Check SSL certificates
    if [ ! -f "./ssl/nova-finance.crt" ] || [ ! -f "./ssl/nova-finance.key" ]; then
        warning "SSL certificates not found. HTTPS will not be available."
    fi
    
    success "Security checks passed"
}

# Health check function
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check backend health
        if curl -f http://localhost/api/health/ &> /dev/null; then
            success "Backend health check passed"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error_exit "Health check failed after $max_attempts attempts"
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Load testing
load_test() {
    log "Running load test..."
    
    if command -v curl &> /dev/null; then
        # Simple load test with curl
        for i in {1..10}; do
            response_time=$(curl -o /dev/null -s -w '%{time_total}\n' http://localhost/api/health/)
            log "Response time: ${response_time}s"
            
            # Check if response time is acceptable (less than 2 seconds)
            if (( $(echo "$response_time > 2" | bc -l) )); then
                warning "High response time detected: ${response_time}s"
            fi
        done
        success "Load test completed"
    else
        warning "curl not found, skipping load test"
    fi
}

# Monitor deployment
monitor_deployment() {
    log "Monitoring deployment for 5 minutes..."
    
    local end_time=$((SECONDS + 300))  # 5 minutes
    
    while [ $SECONDS -lt $end_time ]; do
        # Check if all containers are running
        if docker-compose ps | grep -q "Exit"; then
            error_exit "One or more containers have exited"
        fi
        
        # Check memory usage
        memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tail -n +2)
        log "Container resource usage:"
        echo "$memory_usage" | tee -a "$LOG_FILE"
        
        sleep 30
    done
    
    success "Deployment monitoring completed"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current containers
    docker-compose down
    
    # Restore from backup if needed
    if [ -n "$CURRENT_BACKUP" ] && [ -f "$CURRENT_BACKUP/database_backup.sql" ]; then
        log "Restoring database from backup..."
        docker-compose up -d postgres
        sleep 10
        cat "$CURRENT_BACKUP/database_backup.sql" | docker-compose exec -T postgres psql -U nova_user -d nova_finance
    fi
    
    error_exit "Deployment rolled back"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups (keeping last 5)..."
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" | sort | head -n -5 | xargs rm -rf
        success "Old backups cleaned up"
    fi
}

# Main deployment function
deploy() {
    log "Starting Nova Finance deployment..."
    
    # Set trap for cleanup on error
    trap rollback ERR
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down || true
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose pull
    
    # Build new images
    log "Building application images..."
    docker-compose build --no-cache
    
    # Start services in correct order
    log "Starting infrastructure services..."
    docker-compose up -d postgres redis elasticsearch
    
    # Wait for databases to be ready
    sleep 30
    
    log "Starting application services..."
    docker-compose up -d backend
    
    # Wait for backend to be ready
    sleep 20
    
    log "Starting frontend and monitoring..."
    docker-compose up -d frontend prometheus grafana kibana logstash falco
    
    # Wait for all services to be ready
    sleep 30
    
    success "All services started successfully"
}

# SSL certificate setup
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [ ! -d "./ssl" ]; then
        mkdir -p ./ssl
    fi
    
    # Check if certificates exist
    if [ ! -f "./ssl/nova-finance.crt" ]; then
        warning "SSL certificate not found. You should obtain a proper SSL certificate."
        log "Generating self-signed certificate for development..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./ssl/nova-finance.key \
            -out ./ssl/nova-finance.crt \
            -subj "/C=US/ST=State/L=City/O=NovaFinance/OU=IT/CN=nova-finance.com"
        
        chmod 600 ./ssl/nova-finance.key
        chmod 644 ./ssl/nova-finance.crt
        
        warning "Self-signed certificate generated. Replace with proper certificate in production."
    fi
}

# Main execution
main() {
    log "Nova Finance Deployment Started"
    
    check_root
    check_prerequisites
    security_checks
    setup_ssl
    create_backup
    deploy
    health_check
    load_test
    monitor_deployment
    cleanup_backups
    
    success "Nova Finance deployment completed successfully!"
    log "Access the application at: https://your-domain.com"
    log "Monitoring dashboard: http://your-domain.com:3001"
    log "Log analysis: http://your-domain.com:5601"
}

# Help function
show_help() {
    echo "Nova Finance Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --rollback     Rollback to previous deployment"
    echo "  --backup-only  Create backup only"
    echo "  --health-check Health check only"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --rollback)
        rollback
        exit 0
        ;;
    --backup-only)
        create_backup
        exit 0
        ;;
    --health-check)
        health_check
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac