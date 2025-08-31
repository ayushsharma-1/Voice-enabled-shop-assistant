# 🚀 EC2 Deployment Guide for Voice Command Shopping Assistant

This guide provides multiple deployment options for running your Voice Command Shopping Assistant on EC2 instance `13.203.224.91`.

## 📋 Prerequisites

### EC2 Security Group Configuration
Make sure your EC2 security group allows inbound traffic on:
- **Port 3000** (Frontend)
- **Port 8000** (Backend API)
- **Port 22** (SSH)
- **Port 27017** (MongoDB - optional, for external access)

### Required API Keys
You'll need API keys for:
- **GROQ API** (for LLM processing)
- **AssemblyAI** (for speech-to-text)

## 🎯 Deployment Options

### Option 1: Quick Start (Recommended for Testing)

The fastest way to get started:

```bash
# Make script executable
chmod +x start.sh

# Start all services
./start.sh

# Other commands
./start.sh stop     # Stop services
./start.sh restart  # Restart services
./start.sh status   # Check status
./start.sh logs     # View logs
```

**Features:**
- ✅ Simple and fast
- ✅ Uses system Python and Node.js
- ✅ Background processes with PID files
- ✅ Automatic environment setup

### Option 2: Production Deployment (Recommended for Production)

For a more robust deployment with PM2 process management:

```bash
# Make script executable
chmod +x deploy.sh

# Full deployment
./deploy.sh

# Other commands
./deploy.sh stop     # Stop services
./deploy.sh restart  # Restart services
./deploy.sh status   # Check status
./deploy.sh logs     # View PM2 logs
```

**Features:**
- ✅ PM2 process management
- ✅ Automatic restarts on failure
- ✅ Better logging and monitoring
- ✅ Nginx reverse proxy option
- ✅ Firewall configuration
- ✅ Virtual environment isolation

### Option 3: Docker Deployment (Recommended for Containerization)

For containerized deployment with Docker:

```bash
# Make script executable
chmod +x docker-deploy.sh

# Deploy with Docker
./docker-deploy.sh

# Other commands
./docker-deploy.sh start    # Start containers
./docker-deploy.sh stop     # Stop containers
./docker-deploy.sh restart  # Restart containers
./docker-deploy.sh rebuild  # Rebuild images
./docker-deploy.sh logs     # View container logs
./docker-deploy.sh clean    # Clean environment
```

**Features:**
- ✅ Complete containerization
- ✅ MongoDB included
- ✅ Easy scaling and management
- ✅ Isolated environments
- ✅ Production-ready Nginx setup

## 🔧 Configuration

### Environment Variables

After running any deployment script, update the environment files:

1. **Backend Environment** (`Voice-Command-Shopping-Assistant/.env`):
```env
GROQ_API_KEY=your_actual_groq_api_key
ASSEMBLYAI_API_KEY=your_actual_assemblyai_api_key
MONGO_URI=mongodb://localhost:27017
```

2. **Frontend Environment** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://13.203.224.91:8000
VITE_DEFAULT_USER=testuser
```

### EC2 Instance Setup

1. **Connect to your EC2 instance:**
```bash
ssh -i your-key.pem ubuntu@13.203.224.91
```

2. **Clone your repository:**
```bash
git clone https://github.com/your-username/Voice-enabled-shop-assistant.git
cd Voice-enabled-shop-assistant
```

3. **Run deployment script:**
```bash
chmod +x start.sh
./start.sh
```

## 🌐 Access Your Application

After successful deployment:

- **Frontend Application:** http://13.203.224.91:3000
- **Backend API:** http://13.203.224.91:8000
- **API Documentation:** http://13.203.224.91:8000/docs
- **Health Check:** http://13.203.224.91:8000/health

## 🔍 Troubleshooting

### Common Issues and Solutions

1. **Port Already in Use:**
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill process
sudo fuser -k 3000/tcp
sudo fuser -k 8000/tcp
```

2. **Permission Denied:**
```bash
chmod +x deploy.sh
chmod +x start.sh
chmod +x docker-deploy.sh
```

3. **Node.js/Python Not Found:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
```

4. **MongoDB Connection Issues:**
```bash
# Start MongoDB
sudo systemctl start mongod
# OR
sudo service mongodb start
```

5. **Docker Issues:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Log Files

- **Quick Start:** `./backend.log`, `./frontend.log`
- **Production:** PM2 logs via `pm2 logs`
- **Docker:** `docker-compose logs`

### Service Management

#### Quick Start
```bash
./start.sh status  # Check status
./start.sh logs    # View logs
```

#### Production (PM2)
```bash
pm2 status         # Check PM2 processes
pm2 logs           # View all logs
pm2 restart all    # Restart all processes
pm2 monit          # Monitor processes
```

#### Docker
```bash
docker-compose ps          # Check containers
docker-compose logs -f     # Follow logs
docker-compose restart     # Restart services
```

## 🔒 Security Considerations

1. **API Keys:** Never commit API keys to version control
2. **Firewall:** Configure EC2 security groups properly
3. **HTTPS:** Consider SSL certificates for production
4. **MongoDB:** Secure MongoDB with authentication
5. **Updates:** Keep dependencies updated

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://13.203.224.91:8000/health

# Frontend availability
curl http://13.203.224.91:3000

# MongoDB connection
curl http://13.203.224.91:8000/store
```

### Performance Monitoring
```bash
# System resources
htop
free -h
df -h

# Process monitoring (PM2)
pm2 monit

# Docker stats
docker stats
```

## 🚀 Production Optimizations

1. **Use HTTPS with SSL certificates**
2. **Set up a proper domain name**
3. **Configure Nginx as reverse proxy**
4. **Enable gzip compression**
5. **Set up monitoring and alerts**
6. **Configure automated backups**
7. **Use a managed MongoDB service**

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Verify API keys are correct
3. Ensure all ports are open in security groups
4. Check system resources (disk space, memory)
5. Restart services if needed

## 🔄 Updates

To update your application:

```bash
# Pull latest changes
git pull origin main

# Restart services based on your deployment method:

# Quick Start
./start.sh restart

# Production
pm2 restart all

# Docker
./docker-deploy.sh rebuild
```

---

**Happy Shopping! 🛒✨**
