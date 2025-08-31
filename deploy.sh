#!/bin/bash

# Voice-Enabled Shopping Assistant Deployment Script
# For EC2 instance: 13.203.224.91

set -e

echo "🚀 Starting Voice-Enabled Shopping Assistant Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    print_status "Docker installed successfully!"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully!"
else
    print_status "Docker Compose is already installed"
fi

# Create application directory
APP_DIR="/opt/voice-shopping-assistant"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found! Copying from .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your actual API keys before running the application"
    else
        print_error ".env.example file not found! Please create .env file manually"
        exit 1
    fi
fi

# Validate environment variables
print_status "Validating environment variables..."
source .env

if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "your_groq_api_key_here" ]; then
    print_error "GROQ_API_KEY is not set in .env file"
    exit 1
fi

if [ -z "$ASSEMBLYAI_API_KEY" ] || [ "$ASSEMBLYAI_API_KEY" = "your_assemblyai_api_key_here" ]; then
    print_error "ASSEMBLYAI_API_KEY is not set in .env file"
    exit 1
fi

print_status "Environment variables validated successfully!"

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Pull latest images and rebuild
print_status "Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:8000/health &>/dev/null; then
    print_status "✅ Backend service is healthy"
else
    print_error "❌ Backend service is not responding"
    docker-compose logs backend
    exit 1
fi

# Check frontend health
if curl -f http://localhost:80/health &>/dev/null; then
    print_status "✅ Frontend service is healthy"
else
    print_error "❌ Frontend service is not responding"
    docker-compose logs frontend
    exit 1
fi

# Display running containers
print_status "Running containers:"
docker-compose ps

print_status "🎉 Deployment completed successfully!"
print_status "🌐 Frontend: http://13.203.224.91"
print_status "🔧 Backend API: http://13.203.224.91:8000"
print_status "📊 Health Check: http://13.203.224.91:8000/health"

print_warning "📝 Remember to:"
print_warning "1. Configure your firewall to allow ports 80 and 8000"
print_warning "2. Set up SSL certificates for production use"
print_warning "3. Configure domain name if needed"
print_warning "4. Set up monitoring and logging"

echo ""
print_status "🔄 To view logs: docker-compose logs -f"
print_status "🛑 To stop: docker-compose down"
print_status "🔄 To restart: docker-compose restart"
