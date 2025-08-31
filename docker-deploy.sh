#!/bin/bash

# Docker Deployment Script for Voice Command Shopping Assistant
# EC2 Public IP: 13.203.224.91

echo "🐳 Docker Deployment - Voice Command Shopping Assistant"
echo "====================================================="

# Configuration
PUBLIC_IP="13.203.224.91"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"
MONGO_PORT="27017"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Installing Docker..."
        
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        
        print_success "Docker installed. Please logout and login again, then run this script."
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_info "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    print_success "Docker and Docker Compose are ready"
}

# Create backend Dockerfile
create_backend_dockerfile() {
    print_info "Creating backend Dockerfile..."
    
    cat > Voice-Command-Shopping-Assistant/Dockerfile << 'EOF'
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
    
    print_success "Backend Dockerfile created"
}

# Create docker-compose file
create_docker_compose() {
    print_info "Creating docker-compose.yml..."
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:6.0
    container_name: voice-shopping-mongo
    restart: unless-stopped
    ports:
      - "${MONGO_PORT}:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - voice-shopping-network

  # Backend API
  backend:
    build: ./Voice-Command-Shopping-Assistant
    container_name: voice-shopping-backend
    restart: unless-stopped
    ports:
      - "${BACKEND_PORT}:8000"
    environment:
      - MONGO_URI=mongodb://mongodb:27017
      - GROQ_API_KEY=\${GROQ_API_KEY:-your_groq_api_key_here}
      - ASSEMBLYAI_API_KEY=\${ASSEMBLYAI_API_KEY:-your_assemblyai_api_key_here}
    depends_on:
      - mongodb
    networks:
      - voice-shopping-network
    volumes:
      - ./Voice-Command-Shopping-Assistant:/app

  # Frontend React App
  frontend:
    build: ./frontend
    container_name: voice-shopping-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT}:80"
    environment:
      - VITE_API_BASE_URL=http://${PUBLIC_IP}:${BACKEND_PORT}
      - VITE_DEFAULT_USER=testuser
    depends_on:
      - backend
    networks:
      - voice-shopping-network

volumes:
  mongo_data:

networks:
  voice-shopping-network:
    driver: bridge
EOF
    
    print_success "docker-compose.yml created"
}

# Create environment file
create_env_file() {
    if [[ ! -f ".env" ]]; then
        print_info "Creating .env file..."
        
        cat > .env << EOF
# API Keys (PLEASE UPDATE THESE)
GROQ_API_KEY=your_groq_api_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Network Configuration
PUBLIC_IP=${PUBLIC_IP}
FRONTEND_PORT=${FRONTEND_PORT}
BACKEND_PORT=${BACKEND_PORT}
MONGO_PORT=${MONGO_PORT}
EOF
        
        print_warning "Created .env file - PLEASE UPDATE WITH YOUR ACTUAL API KEYS!"
    fi
}

# Update frontend Dockerfile for production
update_frontend_dockerfile() {
    print_info "Updating frontend Dockerfile for production..."
    
    cat > frontend/Dockerfile << EOF
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx configuration
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8000/; \
        proxy_set_header Host \$host; \
        proxy_set_header X-Real-IP \$remote_addr; \
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto \$scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
    
    print_success "Frontend Dockerfile updated"
}

# Build and start services
start_services() {
    print_info "Building and starting services with Docker Compose..."
    
    # Build and start all services
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose build --no-cache
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be ready..."
    
    # Wait for backend
    timeout=60
    while ! curl -s http://localhost:${BACKEND_PORT}/health >/dev/null 2>&1 && [ $timeout -gt 0 ]; do
        sleep 2
        timeout=$((timeout-2))
        echo -n "."
    done
    echo ""
    
    if [ $timeout -gt 0 ]; then
        print_success "Backend is ready"
    else
        print_error "Backend failed to start"
    fi
    
    # Wait for frontend
    timeout=30
    while ! curl -s http://localhost:${FRONTEND_PORT} >/dev/null 2>&1 && [ $timeout -gt 0 ]; do
        sleep 2
        timeout=$((timeout-2))
        echo -n "."
    done
    echo ""
    
    if [ $timeout -gt 0 ]; then
        print_success "Frontend is ready"
    else
        print_error "Frontend failed to start"
    fi
}

# Seed database
seed_database() {
    print_info "Seeding database..."
    
    if [[ -f "Voice-Command-Shopping-Assistant/seed_store.py" ]]; then
        docker-compose exec backend python seed_store.py
        print_success "Database seeded successfully"
    fi
}

# Show status
show_status() {
    echo ""
    echo "📋 Docker Services Status:"
    echo "=========================="
    docker-compose ps
    
    echo ""
    echo "🌐 Application URLs:"
    echo "==================="
    echo "• Frontend: http://${PUBLIC_IP}:${FRONTEND_PORT}"
    echo "• Backend API: http://${PUBLIC_IP}:${BACKEND_PORT}"
    echo "• API Documentation: http://${PUBLIC_IP}:${BACKEND_PORT}/docs"
    echo "• Health Check: http://${PUBLIC_IP}:${BACKEND_PORT}/health"
    
    echo ""
    echo "🔧 Useful Commands:"
    echo "==================="
    echo "• View logs: docker-compose logs -f"
    echo "• Stop services: docker-compose down"
    echo "• Restart services: docker-compose restart"
    echo "• View backend logs: docker-compose logs backend"
    echo "• View frontend logs: docker-compose logs frontend"
    echo "• Exec into backend: docker-compose exec backend bash"
}

# Main deployment function
deploy() {
    print_info "Starting Docker deployment..."
    
    # Check if we're in the right directory
    if [[ ! -d "Voice-Command-Shopping-Assistant" ]] || [[ ! -d "frontend" ]]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    check_docker
    create_backend_dockerfile
    create_docker_compose
    create_env_file
    update_frontend_dockerfile
    start_services
    wait_for_services
    seed_database
    show_status
    
    print_success "🎉 Docker deployment completed!"
    print_warning "Remember to update .env file with your actual API keys!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "start")
        docker-compose up -d
        show_status
        ;;
    "stop")
        docker-compose down
        print_success "Services stopped"
        ;;
    "restart")
        docker-compose restart
        show_status
        ;;
    "rebuild")
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        show_status
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        show_status
        ;;
    "clean")
        docker-compose down --volumes --remove-orphans
        docker system prune -f
        print_success "Docker environment cleaned"
        ;;
    *)
        echo "Usage: $0 {deploy|start|stop|restart|rebuild|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment setup (default)"
        echo "  start   - Start services"
        echo "  stop    - Stop services"
        echo "  restart - Restart services"
        echo "  rebuild - Rebuild and restart services"
        echo "  logs    - View logs"
        echo "  status  - Show service status"
        echo "  clean   - Clean Docker environment"
        ;;
esac
