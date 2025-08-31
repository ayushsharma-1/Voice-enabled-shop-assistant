#!/bin/bash

# Production deployment script for Voice-Enabled Shopping Assistant
# This script sets up the application to run permanently on EC2

set -e

echo "🚀 Setting up Voice-Enabled Shopping Assistant for permanent deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create systemd service for permanent running
print_status "Creating systemd service for permanent deployment..."

sudo tee /etc/systemd/system/voice-shopping.service > /dev/null <<EOF
[Unit]
Description=Voice-Enabled Shopping Assistant
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/\$(whoami)/Desktop/Voice-enabled-shop-assistant
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=\$(whoami)
Group=\$(whoami)

[Install]
WantedBy=multi-user.target
EOF

# Replace user placeholder with actual user
sudo sed -i "s/\$(whoami)/$USER/g" /etc/systemd/system/voice-shopping.service

# Enable and start the service
print_status "Enabling and starting the systemd service..."
sudo systemctl daemon-reload
sudo systemctl enable voice-shopping.service
sudo systemctl start voice-shopping.service

# Configure UFW firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 8000/tcp    # Backend API
sudo ufw --force enable

# Create nginx reverse proxy configuration (optional)
print_status "Setting up nginx reverse proxy..."
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/voice-shopping > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 13.203.224.91 _;

    # Redirect API calls to backend
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 30s;
    }

    # Serve frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend health check
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_set_header Host \$host;
    }
}
EOF

# Enable the nginx site
sudo ln -sf /etc/nginx/sites-available/voice-shopping /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Create monitoring script
print_status "Creating monitoring script..."
tee /home/$USER/monitor-voice-shopping.sh > /dev/null <<'EOF'
#!/bin/bash

# Monitoring script for Voice-Enabled Shopping Assistant
echo "🔍 Voice-Enabled Shopping Assistant Status Report"
echo "=================================================="
echo "📅 $(date)"
echo ""

# Check systemd service
echo "🔧 Systemd Service Status:"
systemctl is-active voice-shopping.service && echo "✅ Service is active" || echo "❌ Service is not active"
echo ""

# Check Docker containers
echo "🐳 Docker Containers:"
docker-compose ps
echo ""

# Check service health
echo "🏥 Health Checks:"
if curl -f http://localhost:8000/health &>/dev/null; then
    echo "✅ Backend API is healthy"
else
    echo "❌ Backend API is not responding"
fi

if curl -f http://localhost:80 &>/dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi
echo ""

# Check resource usage
echo "💻 Resource Usage:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"
echo ""

# Check logs for errors
echo "📋 Recent Error Logs:"
docker-compose logs --tail=10 backend | grep -i error || echo "No recent errors found"
echo ""

echo "=================================================="
EOF

chmod +x /home/$USER/monitor-voice-shopping.sh

# Create log rotation configuration
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/voice-shopping > /dev/null <<EOF
/var/lib/docker/containers/*/*-json.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    postrotate
        /bin/kill -USR1 \$(cat /var/run/docker.pid) 2>/dev/null || true
    endscript
}
EOF

# Create backup script
print_status "Creating backup script..."
tee /home/$USER/backup-voice-shopping.sh > /dev/null <<'EOF'
#!/bin/bash

BACKUP_DIR="/home/$(whoami)/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/$(whoami)/Desktop/Voice-enabled-shop-assistant"

mkdir -p $BACKUP_DIR

echo "🔄 Creating backup: voice-shopping-$DATE.tar.gz"
tar -czf $BACKUP_DIR/voice-shopping-$DATE.tar.gz -C $APP_DIR .

# Keep only last 5 backups
cd $BACKUP_DIR
ls -t voice-shopping-*.tar.gz | tail -n +6 | xargs -r rm

echo "✅ Backup completed: $BACKUP_DIR/voice-shopping-$DATE.tar.gz"
EOF

chmod +x /home/$USER/backup-voice-shopping.sh

# Add cron job for daily backup
print_status "Setting up daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup-voice-shopping.sh >> /var/log/voice-shopping-backup.log 2>&1") | crontab -

# Create useful aliases
print_status "Creating useful aliases..."
cat >> /home/$USER/.bashrc <<'EOF'

# Voice Shopping Assistant aliases
alias vsa-status='systemctl status voice-shopping.service'
alias vsa-start='sudo systemctl start voice-shopping.service'
alias vsa-stop='sudo systemctl stop voice-shopping.service'
alias vsa-restart='sudo systemctl restart voice-shopping.service'
alias vsa-logs='docker-compose logs -f'
alias vsa-monitor='~/monitor-voice-shopping.sh'
alias vsa-backup='~/backup-voice-shopping.sh'
EOF

print_status "🎉 Production setup completed!"
print_status "📊 Service Status: $(systemctl is-active voice-shopping.service)"
print_status "🌐 Application URL: http://13.203.224.91"
print_status "🔧 Backend API: http://13.203.224.91:8000"

print_warning "📝 Useful commands:"
print_warning "• Check status: vsa-status"
print_warning "• View logs: vsa-logs"
print_warning "• Monitor health: vsa-monitor"
print_warning "• Create backup: vsa-backup"
print_warning "• Restart service: vsa-restart"

echo ""
print_status "🔄 The application will now start automatically on boot!"
print_status "📈 Monitoring and backup scripts are configured!"
print_status "🔒 Firewall is configured for security!"
EOF
