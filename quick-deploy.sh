#!/bin/bash

# 🚀 ONE-CLICK DEPLOYMENT SCRIPT FOR EC2 INSTANCE 13.203.224.91
# Voice-Enabled Shopping Assistant - Complete Setup

set -e

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ASCII Art Banner
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🎤 VOICE-ENABLED SHOPPING ASSISTANT 🛒                ║
║                                                               ║
║                 Production Deployment Script                  ║
║                     EC2: 13.203.224.91                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_status() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}🔧 [STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Run as regular user with sudo privileges."
    exit 1
fi

print_step "Starting complete deployment process..."

# Step 1: System Update
print_step "Updating system packages..."
sudo apt update -y && sudo apt upgrade -y
print_status "System packages updated"

# Step 2: Install Docker
if ! command -v docker &> /dev/null; then
    print_step "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_status "Docker installed successfully"
else
    print_info "Docker is already installed"
fi

# Step 3: Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_step "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_info "Docker Compose is already installed"
fi

# Step 4: Install additional tools
print_step "Installing additional tools..."
sudo apt install -y curl wget nginx ufw git htop
print_status "Additional tools installed"

# Step 5: Configure firewall
print_step "Configuring firewall..."
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP Frontend
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 8000/tcp    # Backend API
sudo ufw --force enable
print_status "Firewall configured"

# Step 6: Stop conflicting services
print_step "Stopping conflicting services..."
sudo systemctl stop nginx || true
sudo systemctl disable nginx || true
print_status "Conflicting services stopped"

# Step 7: Create environment file
print_step "Configuring environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_warning "Please edit .env file with your API keys if needed"
fi
print_status "Environment configured"

# Step 8: Build and deploy containers
print_step "Building Docker containers..."
docker-compose down --remove-orphans || true
docker-compose build --no-cache
print_status "Docker containers built"

print_step "Starting application containers..."
docker-compose up -d
print_status "Application containers started"

# Step 9: Wait for services to be ready
print_step "Waiting for services to initialize..."
echo "Waiting 60 seconds for services to start properly..."
for i in {60..1}; do
    echo -ne "\rCountdown: $i seconds remaining..."
    sleep 1
done
echo ""

# Step 10: Health checks
print_step "Performing health checks..."

# Check backend
if curl -f http://localhost:8000/health &>/dev/null; then
    print_status "Backend API is healthy ✅"
    BACKEND_STATUS="✅ Healthy"
else
    print_warning "Backend API is not responding ⚠️"
    BACKEND_STATUS="⚠️ Not responding"
fi

# Check frontend
if curl -f http://localhost:80/health &>/dev/null; then
    print_status "Frontend is healthy ✅"
    FRONTEND_STATUS="✅ Healthy"
else
    if curl -f http://localhost:80 &>/dev/null; then
        print_status "Frontend is responding ✅"
        FRONTEND_STATUS="✅ Responding"
    else
        print_warning "Frontend is not responding ⚠️"
        FRONTEND_STATUS="⚠️ Not responding"
    fi
fi

# Step 11: Setup systemd service for auto-start
print_step "Setting up systemd service for auto-start..."
sudo tee /etc/systemd/system/voice-shopping.service > /dev/null <<EOF
[Unit]
Description=Voice-Enabled Shopping Assistant
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable voice-shopping.service
print_status "Auto-start service configured"

# Step 12: Create useful scripts
print_step "Creating management scripts..."

# Monitor script
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "🔍 Voice Shopping Assistant Status"
echo "=================================="
echo "📅 $(date)"
echo ""
echo "🐳 Container Status:"
docker-compose ps
echo ""
echo "🏥 Health Checks:"
curl -s http://localhost:8000/health | jq . 2>/dev/null || curl -s http://localhost:8000/health
echo ""
echo "💻 System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
echo "Memory: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "Disk: $(df -h / | awk 'NR==2{print $5}')"
EOF
chmod +x monitor.sh

# Backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/voice-shopping-backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/voice-shopping-$DATE.tar.gz . --exclude=node_modules --exclude=.git
echo "✅ Backup created: $BACKUP_DIR/voice-shopping-$DATE.tar.gz"
EOF
chmod +x backup.sh

# Quick commands script
cat > commands.sh << 'EOF'
#!/bin/bash
echo "🎯 Voice Shopping Assistant Commands"
echo "===================================="
echo "📊 Status:     docker-compose ps"
echo "📋 Logs:       docker-compose logs -f"
echo "🔄 Restart:    docker-compose restart"
echo "🛑 Stop:       docker-compose down"
echo "▶️  Start:      docker-compose up -d"
echo "🔧 Monitor:    ./monitor.sh"
echo "💾 Backup:     ./backup.sh"
echo "🏥 Health:     curl http://localhost:8000/health"
EOF
chmod +x commands.sh

print_status "Management scripts created"

# Step 13: Final status report
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                     🎉 DEPLOYMENT COMPLETE! 🎉               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🌐 APPLICATION URLS:${NC}"
echo -e "   Frontend:     ${BLUE}http://13.203.224.91${NC}"
echo -e "   Backend API:  ${BLUE}http://13.203.224.91:8000${NC}"
echo -e "   Health Check: ${BLUE}http://13.203.224.91:8000/health${NC}"
echo -e "   API Docs:     ${BLUE}http://13.203.224.91:8000/docs${NC}"
echo ""

echo -e "${GREEN}📊 SERVICE STATUS:${NC}"
echo -e "   Backend:  $BACKEND_STATUS"
echo -e "   Frontend: $FRONTEND_STATUS"
echo ""

echo -e "${GREEN}🔧 MANAGEMENT COMMANDS:${NC}"
echo -e "   View Status:  ${YELLOW}docker-compose ps${NC}"
echo -e "   View Logs:    ${YELLOW}docker-compose logs -f${NC}"
echo -e "   Restart App:  ${YELLOW}docker-compose restart${NC}"
echo -e "   Stop App:     ${YELLOW}docker-compose down${NC}"
echo -e "   Start App:    ${YELLOW}docker-compose up -d${NC}"
echo -e "   Monitor:      ${YELLOW}./monitor.sh${NC}"
echo -e "   Backup:       ${YELLOW}./backup.sh${NC}"
echo -e "   Commands:     ${YELLOW}./commands.sh${NC}"
echo ""

echo -e "${GREEN}🔄 AUTO-START:${NC}"
echo -e "   ✅ Application will start automatically on boot"
echo -e "   ✅ Systemd service: voice-shopping.service"
echo ""

echo -e "${YELLOW}📝 NEXT STEPS:${NC}"
echo -e "   1. Test the application: ${BLUE}http://13.203.224.91${NC}"
echo -e "   2. Check API health: ${BLUE}http://13.203.224.91:8000/health${NC}"
echo -e "   3. Monitor logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "   4. Configure SSL certificate for production (optional)"
echo -e "   5. Set up domain name (optional)"
echo ""

print_status "🚀 Voice-Enabled Shopping Assistant is now running permanently on EC2!"
print_info "📚 Check DEPLOYMENT.md for detailed documentation"

# Show container status
echo ""
print_step "Current container status:"
docker-compose ps

echo ""
echo -e "${CYAN}Happy Shopping! 🛒🎤${NC}"
