#!/bin/bash

# Quick Start Script for Voice Command Shopping Assistant
# EC2 Public IP: 13.203.224.91

echo "🚀 Quick Start - Voice Command Shopping Assistant"
echo "================================================="

# Configuration
export PUBLIC_IP="13.203.224.91"
export FRONTEND_PORT="3000"
export BACKEND_PORT="8000"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Function to start MongoDB
start_mongo() {
    print_info "Starting MongoDB..."
    
    # Try different ways to start MongoDB
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl start mongod 2>/dev/null || sudo systemctl start mongodb 2>/dev/null
    elif command -v service >/dev/null 2>&1; then
        sudo service mongod start 2>/dev/null || sudo service mongodb start 2>/dev/null
    else
        # Start MongoDB manually
        mongod --fork --dbpath /var/lib/mongodb --logpath /var/log/mongodb.log 2>/dev/null &
    fi
    
    sleep 3
    print_success "MongoDB started"
}

# Function to start backend
start_backend() {
    print_info "Starting backend server..."
    
    cd Voice-Command-Shopping-Assistant
    
    # Check if virtual environment exists
    if [[ ! -d "venv" ]]; then
        print_info "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt >/dev/null 2>&1
    
    # Create .env if not exists
    if [[ ! -f ".env" ]]; then
        cat > .env << EOF
GROQ_API_KEY=your_groq_api_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
MONGO_URI=mongodb://localhost:27017
EOF
        print_warning "Created .env file - please update with your API keys!"
    fi
    
    # Seed database
    if [[ -f "seed_store.py" ]]; then
        python seed_store.py >/dev/null 2>&1
    fi
    
    # Start backend server in background
    nohup uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT} > ../backend.log 2>&1 &
    echo $! > ../backend.pid
    
    cd ..
    sleep 3
    print_success "Backend started on http://${PUBLIC_IP}:${BACKEND_PORT}"
}

# Function to start frontend
start_frontend() {
    print_info "Starting frontend server..."
    
    cd frontend
    
    # Create .env if not exists
    if [[ ! -f ".env" ]]; then
        cat > .env << EOF
VITE_API_BASE_URL=http://${PUBLIC_IP}:${BACKEND_PORT}
VITE_DEFAULT_USER=testuser
EOF
    fi
    
    # Install dependencies
    npm install >/dev/null 2>&1
    
    # Build the app
    npm run build >/dev/null 2>&1
    
    # Start frontend server in background
    nohup npm run preview -- --host 0.0.0.0 --port ${FRONTEND_PORT} > ../frontend.log 2>&1 &
    echo $! > ../frontend.pid
    
    cd ..
    sleep 3
    print_success "Frontend started on http://${PUBLIC_IP}:${FRONTEND_PORT}"
}

# Function to stop services
stop_services() {
    print_info "Stopping services..."
    
    # Stop frontend
    if [[ -f "frontend.pid" ]]; then
        kill $(cat frontend.pid) 2>/dev/null
        rm frontend.pid
    fi
    
    # Stop backend
    if [[ -f "backend.pid" ]]; then
        kill $(cat backend.pid) 2>/dev/null
        rm backend.pid
    fi
    
    # Kill any remaining processes
    pkill -f "uvicorn main:app" 2>/dev/null || true
    pkill -f "vite preview" 2>/dev/null || true
    
    print_success "Services stopped"
}

# Function to show status
show_status() {
    echo ""
    echo "📋 Service Status:"
    echo "=================="
    
    # Check if ports are listening
    if netstat -tuln 2>/dev/null | grep ":${BACKEND_PORT}" >/dev/null; then
        print_success "✅ Backend running on port ${BACKEND_PORT}"
        echo "   🔗 API: http://${PUBLIC_IP}:${BACKEND_PORT}"
        echo "   📚 Docs: http://${PUBLIC_IP}:${BACKEND_PORT}/docs"
    else
        echo "❌ Backend not running"
    fi
    
    if netstat -tuln 2>/dev/null | grep ":${FRONTEND_PORT}" >/dev/null; then
        print_success "✅ Frontend running on port ${FRONTEND_PORT}"
        echo "   🌐 App: http://${PUBLIC_IP}:${FRONTEND_PORT}"
    else
        echo "❌ Frontend not running"
    fi
    
    echo ""
    echo "📁 Log files:"
    echo "• Backend logs: ./backend.log"
    echo "• Frontend logs: ./frontend.log"
}

# Main execution
case "${1:-start}" in
    "start")
        print_info "Starting all services..."
        start_mongo
        start_backend
        start_frontend
        show_status
        echo ""
        print_warning "Important:"
        print_warning "1. Update API keys in Voice-Command-Shopping-Assistant/.env"
        print_warning "2. Open EC2 security group ports: ${FRONTEND_PORT}, ${BACKEND_PORT}"
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 2
        start_mongo
        start_backend
        start_frontend
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        echo "=== Backend Logs ==="
        tail -n 20 backend.log 2>/dev/null || echo "No backend logs found"
        echo ""
        echo "=== Frontend Logs ==="
        tail -n 20 frontend.log 2>/dev/null || echo "No frontend logs found"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services (default)"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show service status"
        echo "  logs    - Show recent logs"
        ;;
esac
