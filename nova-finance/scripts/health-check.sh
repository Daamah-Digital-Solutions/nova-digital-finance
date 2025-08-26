#!/bin/bash

# Nova Finance Health Check Script
# Comprehensive health monitoring for all services

set -e

# Configuration
LOG_FILE="/var/log/nova-finance/health-check.log"
ALERT_EMAIL="admin@nova-finance.com"
COMPOSE_FILE="/opt/nova-finance/docker-compose.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Health status
OVERALL_STATUS="HEALTHY"
FAILED_CHECKS=0

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

check_status() {
    local service="$1"
    local check_result="$2"
    
    if [ "$check_result" -eq 0 ]; then
        log "${GREEN}✓ $service: HEALTHY${NC}"
    else
        log "${RED}✗ $service: FAILED${NC}"
        OVERALL_STATUS="UNHEALTHY"
        ((FAILED_CHECKS++))
    fi
}

# Check Docker services
check_docker_services() {
    log "${BLUE}Checking Docker services...${NC}"
    
    local services=("postgres" "redis" "backend" "frontend" "elasticsearch" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "$service.*Up"; then
            check_status "Docker $service" 0
        else
            check_status "Docker $service" 1
        fi
    done
}

# Check database connectivity
check_database() {
    log "${BLUE}Checking database connectivity...${NC}"
    
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U nova_user >/dev/null 2>&1; then
        check_status "PostgreSQL Connection" 0
    else
        check_status "PostgreSQL Connection" 1
        return
    fi
    
    # Check database queries
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U nova_user -d nova_finance -c "SELECT 1;" >/dev/null 2>&1; then
        check_status "Database Query" 0
    else
        check_status "Database Query" 1
    fi
}

# Check Redis connectivity
check_redis() {
    log "${BLUE}Checking Redis connectivity...${NC}"
    
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping | grep -q "PONG"; then
        check_status "Redis Connection" 0
    else
        check_status "Redis Connection" 1
    fi
}

# Check API endpoints
check_api_endpoints() {
    log "${BLUE}Checking API endpoints...${NC}"
    
    local endpoints=(
        "http://localhost:8000/api/health/"
        "http://localhost:8000/api/auth/login/"
        "http://localhost:8000/api/loans/"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local service_name=$(echo "$endpoint" | sed 's|.*/api/||' | sed 's|/$||')
        
        if curl -f -s "$endpoint" >/dev/null 2>&1; then
            check_status "API $service_name" 0
        else
            check_status "API $service_name" 1
        fi
    done
}

# Check frontend accessibility
check_frontend() {
    log "${BLUE}Checking frontend accessibility...${NC}"
    
    if curl -f -s "http://localhost/" >/dev/null 2>&1; then
        check_status "Frontend" 0
    else
        check_status "Frontend" 1
    fi
}

# Check SSL certificate
check_ssl_certificate() {
    log "${BLUE}Checking SSL certificate...${NC}"
    
    if [ -f "/opt/nova-finance/ssl/nova-finance.crt" ]; then
        local cert_expiry=$(openssl x509 -enddate -noout -in /opt/nova-finance/ssl/nova-finance.crt | cut -d= -f2)
        local expiry_timestamp=$(date -d "$cert_expiry" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ "$days_until_expiry" -gt 30 ]; then
            check_status "SSL Certificate" 0
            log "SSL certificate expires in $days_until_expiry days"
        elif [ "$days_until_expiry" -gt 7 ]; then
            check_status "SSL Certificate" 0
            log "${YELLOW}WARNING: SSL certificate expires in $days_until_expiry days${NC}"
        else
            check_status "SSL Certificate" 1
            log "${RED}CRITICAL: SSL certificate expires in $days_until_expiry days${NC}"
        fi
    else
        log "${YELLOW}WARNING: SSL certificate not found${NC}"
    fi
}

# Check disk space
check_disk_space() {
    log "${BLUE}Checking disk space...${NC}"
    
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 80 ]; then
        check_status "Disk Space ($disk_usage%)" 0
    elif [ "$disk_usage" -lt 90 ]; then
        check_status "Disk Space ($disk_usage%)" 0
        log "${YELLOW}WARNING: Disk usage is at $disk_usage%${NC}"
    else
        check_status "Disk Space ($disk_usage%)" 1
        log "${RED}CRITICAL: Disk usage is at $disk_usage%${NC}"
    fi
}

# Check memory usage
check_memory_usage() {
    log "${BLUE}Checking memory usage...${NC}"
    
    local memory_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    
    if [ "$memory_usage" -lt 80 ]; then
        check_status "Memory Usage ($memory_usage%)" 0
    elif [ "$memory_usage" -lt 90 ]; then
        check_status "Memory Usage ($memory_usage%)" 0
        log "${YELLOW}WARNING: Memory usage is at $memory_usage%${NC}"
    else
        check_status "Memory Usage ($memory_usage%)" 1
        log "${RED}CRITICAL: Memory usage is at $memory_usage%${NC}"
    fi
}

# Check monitoring services
check_monitoring() {
    log "${BLUE}Checking monitoring services...${NC}"
    
    # Check Prometheus
    if curl -f -s "http://localhost:9090/-/healthy" >/dev/null 2>&1; then
        check_status "Prometheus" 0
    else
        check_status "Prometheus" 1
    fi
    
    # Check Grafana
    if curl -f -s "http://localhost:3001/api/health" >/dev/null 2>&1; then
        check_status "Grafana" 0
    else
        check_status "Grafana" 1
    fi
    
    # Check Elasticsearch
    if curl -f -s "http://localhost:9200/_cluster/health" >/dev/null 2>&1; then
        check_status "Elasticsearch" 0
    else
        check_status "Elasticsearch" 1
    fi
}

# Check security services
check_security() {
    log "${BLUE}Checking security services...${NC}"
    
    # Check Falco
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "falco.*Up"; then
        check_status "Falco Security Monitor" 0
    else
        check_status "Falco Security Monitor" 1
    fi
    
    # Check fail2ban
    if systemctl is-active --quiet fail2ban; then
        check_status "Fail2ban" 0
    else
        check_status "Fail2ban" 1
    fi
    
    # Check firewall
    if ufw status | grep -q "Status: active"; then
        check_status "UFW Firewall" 0
    else
        check_status "UFW Firewall" 1
    fi
}

# Check backup status
check_backup_status() {
    log "${BLUE}Checking backup status...${NC}"
    
    local latest_backup=$(find /backups/nova-finance -name "nova_backup_*.tar.gz" -mtime -1 | head -1)
    
    if [ -n "$latest_backup" ]; then
        check_status "Recent Backup" 0
        local backup_size=$(ls -lh "$latest_backup" | awk '{print $5}')
        log "Latest backup: $(basename "$latest_backup") ($backup_size)"
    else
        check_status "Recent Backup" 1
        log "${YELLOW}WARNING: No recent backup found (within last 24 hours)${NC}"
    fi
}

# Send alerts if needed
send_alerts() {
    if [ "$OVERALL_STATUS" != "HEALTHY" ]; then
        local alert_message="Nova Finance Health Check FAILED
        
Overall Status: $OVERALL_STATUS
Failed Checks: $FAILED_CHECKS
Timestamp: $(date)
Server: $(hostname)

Please check the logs for details: $LOG_FILE

Recent log entries:
$(tail -20 "$LOG_FILE")
"
        
        # Send email alert (if configured)
        if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
            echo "$alert_message" | mail -s "Nova Finance Health Check FAILED" "$ALERT_EMAIL"
            log "Alert email sent to $ALERT_EMAIL"
        fi
        
        # Send webhook alert (if configured)
        if [ -n "$WEBHOOK_URL" ]; then
            curl -X POST "$WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d "{\"text\":\"Nova Finance Health Check FAILED\",\"status\":\"$OVERALL_STATUS\",\"failed_checks\":$FAILED_CHECKS}" \
                >/dev/null 2>&1 || true
        fi
    fi
}

# Main execution
main() {
    log "=================================================="
    log "Starting Nova Finance Health Check"
    log "=================================================="
    
    check_docker_services
    check_database
    check_redis
    check_api_endpoints
    check_frontend
    check_ssl_certificate
    check_disk_space
    check_memory_usage
    check_monitoring
    check_security
    check_backup_status
    
    log "=================================================="
    log "Health Check Summary"
    log "Overall Status: $OVERALL_STATUS"
    log "Failed Checks: $FAILED_CHECKS"
    log "=================================================="
    
    send_alerts
    
    if [ "$OVERALL_STATUS" = "HEALTHY" ]; then
        log "${GREEN}All systems are healthy!${NC}"
        exit 0
    else
        log "${RED}Some systems are unhealthy. Please investigate.${NC}"
        exit 1
    fi
}

# Help function
show_help() {
    echo "Nova Finance Health Check Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --quiet, -q    Run in quiet mode (no output to console)"
    echo "  --verbose, -v  Run in verbose mode"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --quiet|-q)
        main >/dev/null 2>&1
        ;;
    --verbose|-v)
        set -x
        main
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