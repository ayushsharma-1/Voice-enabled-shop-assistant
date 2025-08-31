# Voice-Enabled Shopping Assistant - Deployment Guide

## 🚀 Quick Deployment for EC2 Instance (13.203.224.91)

This guide will help you deploy the Voice-Enabled Shopping Assistant on your EC2 instance with Docker for permanent operation.

## 📋 Prerequisites

- EC2 instance running Ubuntu 20.04+ with public IP: `13.203.224.91`
- SSH access to the instance
- At least 2GB RAM and 10GB storage
- API keys for:
  - Groq API (for LLM processing)
  - AssemblyAI (for voice recognition)
  - MongoDB Atlas connection string

## 🛠️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   MongoDB       │
│   (React/Vite)  │◄──►│   (FastAPI)      │◄──►│   (Atlas)       │
│   Port: 80      │    │   Port: 8000     │    │   Cloud         │
│   Nginx         │    │   Python         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Automated Deployment

### Step 1: Clone and Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd Voice-enabled-shop-assistant

# Make scripts executable
chmod +x deploy.sh
chmod +x production-setup.sh
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your actual API keys
nano .env
```

Edit the `.env` file with your actual values:
```env
GROQ_API_KEY=your_actual_groq_api_key
ASSEMBLYAI_API_KEY=your_actual_assemblyai_api_key
MONGO_URI=mongodb+srv://TaskM:Psit2023@kilo.fblqh.mongodb.net/Unthinkable?retryWrites=true&w=majority
ENVIRONMENT=production
DEBUG=false
```

### Step 3: Deploy the Application

```bash
# Run the deployment script
./deploy.sh
```

### Step 4: Setup for Permanent Operation

```bash
# Setup production environment with auto-start
./production-setup.sh
```

## 🔧 Manual Deployment (Alternative)

If you prefer manual deployment:

### Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Build and Run

```bash
# Build and start containers
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
```

## 🌐 Access Your Application

After successful deployment:

- **Frontend**: http://13.203.224.91
- **Backend API**: http://13.203.224.91:8000
- **Health Check**: http://13.203.224.91:8000/health
- **API Documentation**: http://13.203.224.91:8000/docs

## 📊 Management Commands

### Useful Aliases (Available after production setup)

```bash
vsa-status      # Check service status
vsa-start       # Start the service
vsa-stop        # Stop the service
vsa-restart     # Restart the service
vsa-logs        # View real-time logs
vsa-monitor     # Health monitoring
vsa-backup      # Create backup
```

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild and restart
docker-compose down && docker-compose build && docker-compose up -d

# Check container status
docker-compose ps
```

## 🔒 Security Configuration

The production setup automatically configures:

- **Firewall (UFW)**:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 8000 (Backend API)

- **Nginx Reverse Proxy**: Routes traffic efficiently
- **Docker Security**: Non-root user containers
- **Log Rotation**: Prevents disk space issues

## 📈 Monitoring & Maintenance

### Health Monitoring

```bash
# Quick health check
~/monitor-voice-shopping.sh

# Check service status
systemctl status voice-shopping.service
```

### Backup & Recovery

```bash
# Manual backup
~/backup-voice-shopping.sh

# Automatic daily backups are configured via cron
# Backups stored in: ~/backups/
```

### Log Management

```bash
# View application logs
docker-compose logs backend
docker-compose logs frontend

# View system logs
journalctl -u voice-shopping.service -f
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :8000
   ```

2. **API keys not working**:
   ```bash
   # Check environment variables
   docker-compose exec backend env | grep API
   ```

3. **Database connection issues**:
   ```bash
   # Test MongoDB connection
   docker-compose exec backend python -c "from db import client; print(client.admin.command('ping'))"
   ```

4. **Service not starting**:
   ```bash
   systemctl status voice-shopping.service
   journalctl -u voice-shopping.service -n 50
   ```

### Recovery Commands

```bash
# Full reset and redeploy
docker-compose down --volumes --remove-orphans
docker system prune -f
./deploy.sh
```

## 🔄 Updates & Upgrades

### Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### System Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker resources
docker system prune -f

# Check disk space
df -h
```

## 📞 Support

If you encounter issues:

1. Check the logs: `vsa-logs`
2. Run health monitor: `vsa-monitor`
3. Verify environment variables in `.env`
4. Check firewall settings: `sudo ufw status`
5. Ensure all API keys are valid

## 🎯 Performance Optimization

### Recommended EC2 Instance Types

- **Minimum**: t3.small (2 vCPU, 2GB RAM)
- **Recommended**: t3.medium (2 vCPU, 4GB RAM)
- **Production**: t3.large (2 vCPU, 8GB RAM)

### Storage Requirements

- **Minimum**: 10GB
- **Recommended**: 20GB
- **Production**: 50GB+ with automated backups

---

## 📝 Notes

- The application will automatically start on system boot
- Daily backups are scheduled at 2:00 AM
- Log rotation is configured to prevent disk space issues
- All services include health checks for monitoring
- The deployment is optimized for production use on EC2

**Your Voice-Enabled Shopping Assistant is now ready for production! 🎉**
