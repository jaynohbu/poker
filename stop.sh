#!/bin/bash

# Poker Platform - Stop All Services
# Usage: ./stop.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[!]${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} Poker Platform - Service Manager${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

log_info "Stopping services..."
echo ""

# Stop Node processes (Backend, Web)
if pgrep -f "node.*poker" > /dev/null; then
  log_info "Stopping Node.js services..."
  pkill -f "node.*poker" || true
  sleep 2
  log_success "Node.js services stopped"
fi

# Stop Python processes (ML Service)
if pgrep -f "python.*poker_learner" > /dev/null; then
  log_info "Stopping Python ML Service..."
  pkill -f "python.*poker_learner" || true
  sleep 2
  log_success "Python ML Service stopped"
fi

# Stop Docker containers
if command -v docker &> /dev/null; then
  cd "${SCRIPT_DIR}"
  
  if [ -f "docker-compose.yml" ]; then
    log_info "Stopping Docker services..."
    docker-compose down || true
    log_success "Docker services stopped"
  fi
fi

echo ""
log_success "All services stopped"
echo ""
