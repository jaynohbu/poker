#!/bin/bash

# Poker Platform - Start All Services
# Usage: ./start.sh [options]
# Options:
#   --dev          Start in development mode (with live reload)
#   --check-only   Only check status, don't start services
#   --no-docker    Skip Docker services
#   --no-ml        Skip ML service
#   --no-web       Skip Angular web UI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_LOG_DIR="${SCRIPT_DIR}/.logs"
mkdir -p "${SERVICES_LOG_DIR}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
DEV_MODE=false
CHECK_ONLY=false
SKIP_DOCKER=false
SKIP_ML=false
SKIP_WEB=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dev) DEV_MODE=true; shift ;;
    --check-only) CHECK_ONLY=true; shift ;;
    --no-docker) SKIP_DOCKER=true; shift ;;
    --no-ml) SKIP_ML=true; shift ;;
    --no-web) SKIP_WEB=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[!]${NC} $1"
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    log_error "$1 not found. Please install it."
    return 1
  fi
  return 0
}

check_port_open() {
  local port=$1
  if nc -z localhost "$port" 2>/dev/null; then
    return 0
  fi
  return 1
}

wait_for_service() {
  local service=$1
  local port=$2
  local max_attempts=30
  local attempt=0

  log_info "Waiting for $service on port $port..."
  while ! check_port_open "$port" && [ $attempt -lt $max_attempts ]; do
    sleep 1
    attempt=$((attempt + 1))
  done

  if check_port_open "$port"; then
    log_success "$service is ready"
    return 0
  else
    log_error "$service failed to start"
    return 1
  fi
}

# System checks
check_dependencies() {
  log_info "Checking dependencies..."
  
  local missing=0
  
  if ! check_command "node"; then
    log_warn "Node.js not found (needed for poker_web and poker_backend)"
    missing=$((missing + 1))
  else
    NODE_VERSION=$(node -v)
    log_success "Node.js $NODE_VERSION"
  fi
  
  if ! check_command "python3"; then
    log_warn "Python 3 not found (needed for poker_learner)"
    missing=$((missing + 1))
  else
    PYTHON_VERSION=$(python3 --version)
    log_success "$PYTHON_VERSION"
  fi
  
  if ! check_command "docker"; then
    log_warn "Docker not found (needed for MySQL and Redis)"
    missing=$((missing + 1))
  else
    DOCKER_VERSION=$(docker --version)
    log_success "$DOCKER_VERSION"
  fi
  
  if ! check_command "docker-compose"; then
    log_warn "Docker Compose not found"
    missing=$((missing + 1))
  fi
  
  if [ $missing -gt 0 ]; then
    log_warn "$missing required tools are missing"
    return 1
  fi
  
  return 0
}

# Docker services
start_docker_services() {
  if [ "$SKIP_DOCKER" = true ]; then
    log_warn "Skipping Docker services"
    return 0
  fi

  log_info "Starting Docker services (MySQL, Redis)..."
  
  cd "${SCRIPT_DIR}"
  
  if docker-compose ps | grep -q "poker_mysql"; then
    log_warn "MySQL already running"
  else
    docker-compose up -d mysql
    wait_for_service "MySQL" 3306 || return 1
  fi
  
  if docker-compose ps | grep -q "poker_redis"; then
    log_warn "Redis already running"
  else
    docker-compose up -d redis
    wait_for_service "Redis" 6379 || return 1
  fi
  
  log_success "Docker services running"
  return 0
}

check_docker_services() {
  log_info "Checking Docker services..."
  
  if check_port_open 3306; then
    log_success "MySQL running on port 3306"
  else
    log_error "MySQL not running"
    return 1
  fi
  
  if check_port_open 6379; then
    log_success "Redis running on port 6379"
  else
    log_error "Redis not running"
    return 1
  fi
  
  return 0
}

# Backend
start_backend() {
  log_info "Starting NestJS Backend..."
  
  cd "${SCRIPT_DIR}/poker_backend"
  
  if [ ! -d "node_modules" ]; then
    log_warn "Installing dependencies..."
    npm install
  fi
  
  if [ ! -f ".env" ]; then
    log_warn ".env not found, creating from .env.example"
    cp .env.example .env
  fi
  
  if [ "$DEV_MODE" = true ]; then
    npm run start:dev > "${SERVICES_LOG_DIR}/backend.log" 2>&1 &
  else
    npm run start > "${SERVICES_LOG_DIR}/backend.log" 2>&1 &
  fi
  
  BACKEND_PID=$!
  wait_for_service "Backend" 3000 || return 1
  log_success "Backend running (PID: $BACKEND_PID)"
  
  return 0
}

check_backend() {
  if check_port_open 3000; then
    log_success "Backend running on port 3000"
    return 0
  else
    log_error "Backend not running"
    return 1
  fi
}

# Web UI
start_web() {
  if [ "$SKIP_WEB" = true ]; then
    log_warn "Skipping Angular Web UI"
    return 0
  fi

  log_info "Starting Angular Web UI..."
  
  cd "${SCRIPT_DIR}/poker_web"
  
  if [ ! -d "node_modules" ]; then
    log_warn "Installing dependencies..."
    npm install
  fi
  
  if [ "$DEV_MODE" = true ]; then
    npm run start > "${SERVICES_LOG_DIR}/web.log" 2>&1 &
  else
    npm run build > "${SERVICES_LOG_DIR}/web.log" 2>&1 &
  fi
  
  WEB_PID=$!
  wait_for_service "Web UI" 4200 || return 1
  log_success "Web UI running (PID: $WEB_PID)"
  
  return 0
}

check_web() {
  if check_port_open 4200; then
    log_success "Web UI running on port 4200"
    return 0
  else
    log_error "Web UI not running"
    return 1
  fi
}

# ML Service
start_ml() {
  if [ "$SKIP_ML" = true ]; then
    log_warn "Skipping Python ML Service"
    return 0
  fi

  log_info "Starting Python ML Service..."
  
  cd "${SCRIPT_DIR}/poker_learner"
  
  # Check and activate virtual environment
  if [ ! -d "venv" ]; then
    log_warn "Creating virtual environment..."
    python3 -m venv venv
  fi
  
  # Activate venv
  source venv/bin/activate
  
  # Install requirements
  if ! python3 -c "import tensorflow" 2>/dev/null; then
    log_warn "Installing dependencies..."
    pip install -r requirements.txt > /dev/null 2>&1
  fi
  
  if [ ! -f ".env" ]; then
    log_warn ".env not found, creating from .env.example"
    cp .env.example .env
  fi
  
  python3 app.py > "${SERVICES_LOG_DIR}/ml.log" 2>&1 &
  
  ML_PID=$!
  wait_for_service "ML Service" 5000 || return 1
  log_success "ML Service running (PID: $ML_PID)"
  
  return 0
}

check_ml() {
  if check_port_open 5000; then
    log_success "ML Service running on port 5000"
    return 0
  else
    log_error "ML Service not running"
    return 1
  fi
}

# Status dashboard
show_status() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║    Poker Platform - Status Dashboard   ║${NC}"
  echo -e "${BLUE}╠════════════════════════════════════════╣${NC}"
  
  echo -en "${BLUE}║${NC} MySQL (3306)           "
  if check_port_open 3306; then
    echo -e "${GREEN}✓ Running${NC}        ${BLUE}║${NC}"
  else
    echo -e "${RED}✗ Offline${NC}         ${BLUE}║${NC}"
  fi
  
  echo -en "${BLUE}║${NC} Redis (6379)           "
  if check_port_open 6379; then
    echo -e "${GREEN}✓ Running${NC}        ${BLUE}║${NC}"
  else
    echo -e "${RED}✗ Offline${NC}         ${BLUE}║${NC}"
  fi
  
  echo -en "${BLUE}║${NC} Backend (3000)         "
  if check_port_open 3000; then
    echo -e "${GREEN}✓ Running${NC}        ${BLUE}║${NC}"
  else
    echo -e "${RED}✗ Offline${NC}         ${BLUE}║${NC}"
  fi
  
  echo -en "${BLUE}║${NC} Web UI (4200)          "
  if check_port_open 4200; then
    echo -e "${GREEN}✓ Running${NC}        ${BLUE}║${NC}"
  else
    echo -e "${RED}✗ Offline${NC}         ${BLUE}║${NC}"
  fi
  
  echo -en "${BLUE}║${NC} ML Service (5000)      "
  if check_port_open 5000; then
    echo -e "${GREEN}✓ Running${NC}        ${BLUE}║${NC}"
  else
    echo -e "${RED}✗ Offline${NC}         ${BLUE}║${NC}"
  fi
  
  echo -e "${BLUE}╠════════════════════════════════════════╣${NC}"
  echo -e "${BLUE}║${NC} Logs: ${SERVICES_LOG_DIR}/${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
  echo ""
  
  log_info "Services running in background. View logs with: tail -f .logs/*.log"
  log_info "To stop services: killall node python3"
  echo ""
}

# Main execution
main() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE} Poker Platform - Service Manager${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  
  # Check dependencies
  if ! check_dependencies; then
    log_warn "Some dependencies are missing. Continuing anyway..."
  fi
  echo ""
  
  if [ "$CHECK_ONLY" = true ]; then
    log_info "Checking service status..."
    echo ""
    check_docker_services || true
    check_backend || true
    check_web || true
    check_ml || true
    show_status
    return 0
  fi
  
  # Start services
  log_info "Starting all services..."
  echo ""
  
  if ! start_docker_services; then
    log_error "Failed to start Docker services. Exiting."
    exit 1
  fi
  echo ""
  
  if ! start_backend; then
    log_error "Failed to start backend. Continuing..."
  fi
  echo ""
  
  if ! start_web; then
    log_warn "Failed to start web UI"
  fi
  echo ""
  
  if ! start_ml; then
    log_warn "Failed to start ML service"
  fi
  echo ""
  
  # Show status
  show_status
  
  log_success "All services started!"
  log_info "Access the app at: http://localhost:4200"
  echo ""
}

# Run main
main
