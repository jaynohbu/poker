#!/bin/bash

# Poker Platform - Check Service Status
# Usage: ./status.sh

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

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[!]${NC} $1"
}

check_port() {
  nc -z localhost "$1" 2>/dev/null
  return $?
}

get_service_info() {
  local service=$1
  local port=$2
  
  if check_port "$port"; then
    echo -e "${GREEN}✓${NC} Running on port $port"
    return 0
  else
    echo -e "${RED}✗${NC} Offline"
    return 1
  fi
}

echo -e "${BLUE}╔═════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Poker Platform - Service Status Check         ║${NC}"
echo -e "${BLUE}╠═════════════════════════════════════════════════╣${NC}"

# MySQL
echo -en "${BLUE}║${NC} MySQL (3306)                    "
get_service_info "MySQL" 3306
echo -e "${BLUE}║${NC}"

# Redis
echo -en "${BLUE}║${NC} Redis (6379)                    "
get_service_info "Redis" 6379
echo -e "${BLUE}║${NC}"

# Backend
echo -en "${BLUE}║${NC} NestJS Backend (3000)           "
get_service_info "Backend" 3000
echo -e "${BLUE}║${NC}"

# Web UI
echo -en "${BLUE}║${NC} Angular Web UI (4200)           "
get_service_info "Web" 4200
echo -e "${BLUE}║${NC}"

# ML Service
echo -en "${BLUE}║${NC} Python ML Service (5000)        "
get_service_info "ML" 5000
echo -e "${BLUE}║${NC}"

echo -e "${BLUE}╠═════════════════════════════════════════════════╣${NC}"

# Process info
echo -e "${BLUE}║${NC} Process Information:${NC}"
echo -e "${BLUE}║${NC}"

if pgrep -f "node.*backend" > /dev/null; then
  BACKEND_PID=$(pgrep -f "node.*backend" | head -1)
  echo -e "${BLUE}║${NC}  Backend PID: $BACKEND_PID"
fi

if pgrep -f "node.*web" > /dev/null; then
  WEB_PID=$(pgrep -f "node.*web" | head -1)
  echo -e "${BLUE}║${NC}  Web PID: $WEB_PID"
fi

if pgrep -f "python.*app.py" > /dev/null; then
  ML_PID=$(pgrep -f "python.*app.py" | head -1)
  echo -e "${BLUE}║${NC}  ML Service PID: $ML_PID"
fi

echo -e "${BLUE}║${NC}"
echo -e "${BLUE}╠═════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Quick Commands:${NC}"
echo -e "${BLUE}║${NC}"
echo -e "${BLUE}║${NC}  Start services:  ./start.sh${NC}"
echo -e "${BLUE}║${NC}  Stop services:   ./stop.sh${NC}"
echo -e "${BLUE}║${NC}  Dev mode:        ./start.sh --dev${NC}"
echo -e "${BLUE}║${NC}  Check only:      ./start.sh --check-only${NC}"
echo -e "${BLUE}║${NC}"
echo -e "${BLUE}╚═════════════════════════════════════════════════╝${NC}"
echo ""
