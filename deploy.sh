#!/bin/bash

# Voice Command Shopping Assistant - EC2 Deployment Script
# Public IP: 13.203.224.91
# This script will deploy both frontend and backend services

set -e  # Exit on any error

echo "🚀 Starting Voice Command Shopping Assistant Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PUBLIC_IP="13.203.224.91"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"
MONGO_PORT="27017"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    print_status "Checking port $port..."
    if check_port $port; then
        print_warning "Port $port is in use. Killing existing processes..."
        sudo fuser -k ${port}/tcp 2>/dev/null || true
        sleep 2
    fi
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check if running on Ubuntu/Debian
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        print_status "Operating System: $NAME $VERSION"
    fi
    
    # Check if Python 3.8+ is installed
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d" " -f2)
        print_success "Python version: $PYTHON_VERSION"
    else
        print_error "Python3 is not installed. Installing..."
        sudo apt update
        sudo apt install -y python3 python3-pip python3-venv
    fi
    
    # Check if Node.js is installed
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js version: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Installing..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Check if MongoDB is installed or Docker is available
    if command_exists mongod; then
        print_success "MongoDB is installed"
    elif command_exists docker; then
        print_success "Docker is available for MongoDB"
    else
        print_warning "MongoDB not found. Installing MongoDB..."
        sudo apt update
        sudo apt install -y mongodb
    fi
    
    # Check if PM2 is installed (for process management)
    if command_exists pm2; then
        print_success "PM2 is installed"
    else
        print_status "Installing PM2 for process management..."
        sudo npm install -g pm2
    fi
}

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment file
    if [[ ! -f "Voice-Command-Shopping-Assistant/.env" ]]; then
        print_status "Creating backend .env file..."
        cat > Voice-Command-Shopping-Assistant/.env << EOF
GROQ_API_KEY=your_groq_api_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
MONGO_URI=mongodb://localhost:27017
EOF
        print_warning "Please update Voice-Command-Shopping-Assistant/.env with your actual API keys!"
    fi
    
    # Frontend environment file
    if [[ ! -f "frontend/.env" ]]; then
        print_status "Creating frontend .env file..."
        cat > frontend/.env << EOF
VITE_API_BASE_URL=http://${PUBLIC_IP}:${BACKEND_PORT}
VITE_DEFAULT_USER=testuser
EOF
        print_success "Frontend .env created with API URL: http://${PUBLIC_IP}:${BACKEND_PORT}"
    fi
}

# Function to start MongoDB
start_mongodb() {
    print_status "Starting MongoDB..."
    
    # Kill any existing MongoDB processes
    kill_port $MONGO_PORT
    
    # Start MongoDB
    if command_exists mongod; then
        # Start MongoDB as daemon
        sudo systemctl start mongodb 2>/dev/null || sudo service mongodb start 2>/dev/null || mongod --fork --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log
        print_success "MongoDB started on port $MONGO_PORT"
    elif command_exists docker; then
        # Start MongoDB with Docker
        docker run -d --name voice-shopping-mongo -p ${MONGO_PORT}:27017 mongo:6.0
        print_success "MongoDB started with Docker on port $MONGO_PORT"
    fi
    
    # Wait for MongoDB to be ready
    sleep 5
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd Voice-Command-Shopping-Assistant
    
    # Create virtual environment if it doesn't exist
    if [[ ! -d "venv" ]]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    print_status "Installing backend dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Seed the database if needed
    print_status "Seeding database..."
    if [[ -f "seed_store.py" ]]; then
        python seed_store.py
        print_success "Database seeded successfully"
    fi
    
    cd ..
}

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    
    # Kill any existing backend processes
    kill_port $BACKEND_PORT
    
    cd Voice-Command-Shopping-Assistant
    
    # Start backend with PM2
    source venv/bin/activate
    pm2 delete voice-shopping-backend 2>/dev/null || true
    pm2 start "uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT}" --name voice-shopping-backend
    
    print_success "Backend started on http://${PUBLIC_IP}:${BACKEND_PORT}"
    
    cd ..
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the application
    print_status "Building frontend application..."
    npm run build
    
    cd ..
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend server..."
    
    # Kill any existing frontend processes
    kill_port $FRONTEND_PORT
    
    cd frontend
    
    # Update vite config for production
    cat > vite.config.js << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: ${FRONTEND_PORT},
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:${BACKEND_PORT}',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    port: ${FRONTEND_PORT},
    host: '0.0.0.0'
  },
  define: {
    'process.env': {}
  }
})
EOF
    
    # Start frontend with PM2
    pm2 delete voice-shopping-frontend 2>/dev/null || true
    pm2 start "npm run preview" --name voice-shopping-frontend
    
    print_success "Frontend started on http://${PUBLIC_IP}:${FRONTEND_PORT}"
    
    cd ..
}

# Function to configure firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    # Check if ufw is available
    if command_exists ufw; then
        sudo ufw allow $FRONTEND_PORT/tcp
        sudo ufw allow $BACKEND_PORT/tcp
        sudo ufw allow $MONGO_PORT/tcp
        sudo ufw allow ssh
        print_success "Firewall configured for ports: $FRONTEND_PORT, $BACKEND_PORT, $MONGO_PORT"
    fi
}

# Function to display status
show_status() {
    print_status "Checking service status..."
    
    echo ""
    echo "📋 Service Status:"
    echo "=================="
    
    # Check MongoDB
    if check_port $MONGO_PORT; then
        print_success "✅ MongoDB is running on port $MONGO_PORT"
    else
        print_error "❌ MongoDB is not running"
    fi
    
    # Check Backend
    if check_port $BACKEND_PORT; then
        print_success "✅ Backend is running on port $BACKEND_PORT"
        echo "   🔗 API URL: http://${PUBLIC_IP}:${BACKEND_PORT}"
        echo "   📚 API Docs: http://${PUBLIC_IP}:${BACKEND_PORT}/docs"
    else
        print_error "❌ Backend is not running"
    fi
    
    # Check Frontend
    if check_port $FRONTEND_PORT; then
        print_success "✅ Frontend is running on port $FRONTEND_PORT"
        echo "   🌐 App URL: http://${PUBLIC_IP}:${FRONTEND_PORT}"
    else
        print_error "❌ Frontend is not running"
    fi
    
    echo ""
    echo "🚀 PM2 Process Status:"
    pm2 status 2>/dev/null || echo "PM2 processes not found"
    
    echo ""
    echo "📱 Access your application:"
    echo "Frontend: http://${PUBLIC_IP}:${FRONTEND_PORT}"
    echo "Backend API: http://${PUBLIC_IP}:${BACKEND_PORT}"
    echo "API Documentation: http://${PUBLIC_IP}:${BACKEND_PORT}/docs"
}

# Function to setup nginx (optional)
setup_nginx() {
    if command_exists nginx; then
        print_status "Setting up Nginx reverse proxy..."
        
        # Create nginx config
        sudo tee /etc/nginx/sites-available/voice-shopping << EOF
server {
    listen 80;
    server_name ${PUBLIC_IP};

    # Frontend
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:${BACKEND_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        
        # Enable the site
        sudo ln -sf /etc/nginx/sites-available/voice-shopping /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        
        print_success "Nginx configured. You can also access via http://${PUBLIC_IP}"
    fi
}

# Main deployment function
main() {
    echo "🎯 Target IP: $PUBLIC_IP"
    echo "📦 Frontend Port: $FRONTEND_PORT"
    echo "🔧 Backend Port: $BACKEND_PORT"
    echo "🗄️  MongoDB Port: $MONGO_PORT"
    echo ""
    
    # Check if we're in the right directory
    if [[ ! -d "Voice-Command-Shopping-Assistant" ]] || [[ ! -d "frontend" ]]; then
        print_error "Please run this script from the project root directory"
        print_error "Expected directories: Voice-Command-Shopping-Assistant, frontend"
        exit 1
    fi
    
    # Run deployment steps
    check_requirements
    setup_environment
    start_mongodb
    setup_backend
    start_backend
    setup_frontend
    start_frontend
    setup_firewall
    
    # Optional nginx setup
    read -p "Do you want to setup Nginx reverse proxy? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_nginx
    fi
    
    print_success "🎉 Deployment completed!"
    echo ""
    
    show_status
    
    echo ""
    echo "🔧 Useful commands:"
    echo "==================="
    echo "• View logs: pm2 logs"
    echo "• Restart services: pm2 restart all"
    echo "• Stop services: pm2 stop all"
    echo "• Monitor processes: pm2 monit"
    echo "• Update backend: cd Voice-Command-Shopping-Assistant && git pull && pm2 restart voice-shopping-backend"
    echo "• Update frontend: cd frontend && git pull && npm run build && pm2 restart voice-shopping-frontend"
    echo ""
    
    print_warning "Remember to:"
    print_warning "1. Update API keys in Voice-Command-Shopping-Assistant/.env"
    print_warning "2. Configure EC2 security groups for ports: $FRONTEND_PORT, $BACKEND_PORT"
    print_warning "3. Set up SSL certificates for production use"
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping all services..."
        pm2 stop all
        print_success "All services stopped"
        ;;
    "restart")
        print_status "Restarting all services..."
        pm2 restart all
        print_success "All services restarted"
        ;;
    "status")
        show_status
        ;;
    "logs")
        pm2 logs
        ;;
    *)
        main
        ;;
esac
