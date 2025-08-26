#!/bin/bash

# Nova Finance Production Setup Script
# This script prepares the server for Nova Finance deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root (use sudo)"
fi

log "Starting Nova Finance production server setup..."

# Update system
log "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install essential packages
log "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    htop \
    vim \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    fail2ban \
    ufw \
    logrotate \
    cron \
    ssl-cert

# Install Docker
log "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    success "Docker installed successfully"
else
    log "Docker is already installed"
fi

# Install Docker Compose
log "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION="2.20.0"
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    success "Docker Compose installed successfully"
else
    log "Docker Compose is already installed"
fi

# Create nova user
log "Creating nova user..."
if ! id "nova" &>/dev/null; then
    useradd -m -s /bin/bash nova
    usermod -aG docker nova
    success "Nova user created and added to docker group"
else
    log "Nova user already exists"
fi

# Set up firewall
log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow specific ports for monitoring (restrict to internal network in production)
ufw allow 3001/tcp  # Grafana
ufw allow 5601/tcp  # Kibana
ufw allow 9090/tcp  # Prometheus

# Enable firewall
ufw --force enable
success "Firewall configured successfully"

# Configure fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log

[nova-finance-auth]
enabled = true
filter = nova-finance-auth
logpath = /var/log/nova-finance/*.log
EOF

# Create custom fail2ban filter for Nova Finance
mkdir -p /etc/fail2ban/filter.d
cat > /etc/fail2ban/filter.d/nova-finance-auth.conf << EOF
[Definition]
failregex = .*Failed login attempt.*from <HOST>.*
            .*Suspicious activity.*from <HOST>.*
            .*Multiple authentication failures.*from <HOST>.*
ignoreregex =
EOF

systemctl enable fail2ban
systemctl restart fail2ban
success "Fail2ban configured successfully"

# Set up log rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/nova-finance << EOF
/var/log/nova-finance/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nova nova
    postrotate
        docker kill --signal="USR1" nova_backend 2>/dev/null || true
        docker kill --signal="USR1" nova_frontend 2>/dev/null || true
    endscript
}

/var/log/nginx/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker kill --signal="USR1" nova_frontend 2>/dev/null || true
    endscript
}
EOF

success "Log rotation configured successfully"

# Create directory structure
log "Creating directory structure..."
mkdir -p /opt/nova-finance
mkdir -p /var/log/nova-finance
mkdir -p /backups/nova-finance
mkdir -p /opt/nova-finance/ssl
mkdir -p /opt/nova-finance/monitoring

# Set ownership
chown -R nova:nova /opt/nova-finance
chown -R nova:nova /var/log/nova-finance
chown -R nova:nova /backups/nova-finance

success "Directory structure created successfully"

# Install monitoring tools
log "Installing monitoring tools..."
apt-get install -y \
    prometheus-node-exporter \
    htop \
    iotop \
    nethogs \
    ncdu

systemctl enable prometheus-node-exporter
systemctl start prometheus-node-exporter

success "Monitoring tools installed successfully"

# Set up SSL with Let's Encrypt (optional)
log "Installing Certbot for SSL certificates..."
apt-get install -y certbot
success "Certbot installed (run certbot manually to obtain certificates)"

# Install backup utilities
log "Installing backup utilities..."
apt-get install -y \
    rsync \
    duplicity \
    awscli

success "Backup utilities installed successfully"

# Configure system limits
log "Configuring system limits..."
cat >> /etc/security/limits.conf << EOF
# Nova Finance application limits
nova soft nofile 65536
nova hard nofile 65536
nova soft nproc 4096
nova hard nproc 4096

# Docker limits
root soft nofile 65536
root hard nofile 65536
EOF

# Configure sysctl for better performance
log "Optimizing system parameters..."
cat > /etc/sysctl.d/99-nova-finance.conf << EOF
# Network optimization
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# File system
fs.file-max = 65535
fs.inotify.max_user_watches = 524288
EOF

sysctl -p /etc/sysctl.d/99-nova-finance.conf
success "System parameters optimized"

# Create maintenance scripts
log "Creating maintenance scripts..."
mkdir -p /opt/nova-finance/scripts

cat > /opt/nova-finance/scripts/backup.sh << 'EOF'
#!/bin/bash
# Nova Finance Backup Script

BACKUP_DIR="/backups/nova-finance/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose -f /opt/nova-finance/docker-compose.yml exec -T postgres pg_dump -U nova_user nova_finance > "$BACKUP_DIR/database.sql"

# Backup media files
if [ -d "/opt/nova-finance/media" ]; then
    cp -r /opt/nova-finance/media "$BACKUP_DIR/"
fi

# Compress backup
cd /backups/nova-finance
tar -czf "backup_$(date +%Y%m%d_%H%M%S).tar.gz" "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"

# Keep only last 7 backups
ls -t backup_*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: backup_$(date +%Y%m%d_%H%M%S).tar.gz"
EOF

cat > /opt/nova-finance/scripts/monitor.sh << 'EOF'
#!/bin/bash
# Nova Finance Monitoring Script

LOG_FILE="/var/log/nova-finance/monitor.log"
ALERT_EMAIL="admin@nova-finance.com"

check_service() {
    local service="$1"
    if ! docker-compose -f /opt/nova-finance/docker-compose.yml ps | grep -q "$service.*Up"; then
        echo "$(date): ALERT - Service $service is down" >> "$LOG_FILE"
        # Send alert email (configure mail service)
        # echo "Service $service is down" | mail -s "Nova Finance Alert" "$ALERT_EMAIL"
    fi
}

# Check critical services
check_service "postgres"
check_service "redis"
check_service "backend"
check_service "frontend"

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "$(date): ALERT - Disk usage is ${DISK_USAGE}%" >> "$LOG_FILE"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    echo "$(date): ALERT - Memory usage is ${MEMORY_USAGE}%" >> "$LOG_FILE"
fi
EOF

chmod +x /opt/nova-finance/scripts/*.sh
chown -R nova:nova /opt/nova-finance/scripts

# Set up cron jobs
log "Setting up cron jobs..."
cat > /tmp/nova-cron << EOF
# Backup every day at 2 AM
0 2 * * * /opt/nova-finance/scripts/backup.sh

# Monitor every 5 minutes
*/5 * * * * /opt/nova-finance/scripts/monitor.sh

# Log rotation
0 1 * * * /usr/sbin/logrotate /etc/logrotate.d/nova-finance
EOF

crontab -u nova /tmp/nova-cron
rm /tmp/nova-cron

success "Cron jobs configured successfully"

# Security hardening
log "Applying security hardening..."

# Disable unused services
systemctl disable avahi-daemon 2>/dev/null || true
systemctl disable bluetooth 2>/dev/null || true

# Configure SSH security
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

systemctl restart sshd

# Set up automatic security updates
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

success "Security hardening applied successfully"

# Final setup message
success "Nova Finance production server setup completed!"

echo ""
echo "======================================="
echo "     NOVA FINANCE SERVER SETUP        "
echo "======================================="
echo ""
echo "Server is ready for Nova Finance deployment!"
echo ""
echo "Next steps:"
echo "1. Copy your Nova Finance code to /opt/nova-finance/"
echo "2. Configure your .env file with production settings"
echo "3. Obtain SSL certificates (recommended: Let's Encrypt)"
echo "4. Run the deployment script: ./scripts/deploy.sh"
echo ""
echo "Important directories:"
echo "- Application: /opt/nova-finance/"
echo "- Logs: /var/log/nova-finance/"
echo "- Backups: /backups/nova-finance/"
echo ""
echo "Monitoring URLs (after deployment):"
echo "- Application: https://your-domain.com"
echo "- Grafana: http://your-domain.com:3001"
echo "- Kibana: http://your-domain.com:5601"
echo "- Prometheus: http://your-domain.com:9090"
echo ""
echo "Security features enabled:"
echo "- Firewall (UFW) configured"
echo "- Fail2ban for intrusion prevention"
echo "- Automatic security updates"
echo "- SSH hardened"
echo ""
warning "Remember to:"
warning "- Change default passwords"
warning "- Configure SSL certificates"
warning "- Set up monitoring alerts"
warning "- Test backup and restore procedures"
echo ""