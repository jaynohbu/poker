# Service Management Scripts

Quick scripts to manage all poker platform services.

## 🚀 Quick Start

```bash
# Start all services
./start.sh

# Check status (without starting)
./status.sh

# Stop all services
./stop.sh
```

## 📋 Available Scripts

### `start.sh` — Start All Services

**Usage:**
```bash
./start.sh [options]
```

**Options:**
- `--dev` — Start in development mode (live reload, verbose logging)
- `--check-only` — Only check status, don't start services
- `--no-docker` — Skip MySQL and Redis startup
- `--no-ml` — Skip Python ML service
- `--no-web` — Skip Angular web UI

**Examples:**
```bash
# Start all services in development mode
./start.sh --dev

# Start only backend and databases
./start.sh --no-web --no-ml

# Check if services are running
./start.sh --check-only
```

**What It Does:**
1. ✅ Checks Node.js, Python, Docker are installed
2. ✅ Starts Docker services (MySQL on 3306, Redis on 6379)
3. ✅ Installs npm dependencies if needed
4. ✅ Installs Python dependencies if needed
5. ✅ Starts NestJS Backend on port 3000
6. ✅ Starts Angular Web UI on port 4200
7. ✅ Starts Python ML Service on port 5000
8. ✅ Shows status dashboard with all running services
9. ✅ Logs to `.logs/` directory for debugging

### `status.sh` — Check Service Status

**Usage:**
```bash
./status.sh
```

**Shows:**
- ✓ or ✗ status for each service
- Port numbers
- Running process IDs
- Quick command reference

### `stop.sh` — Stop All Services

**Usage:**
```bash
./stop.sh
```

**Stops:**
- All Node.js processes (Backend, Web)
- All Python processes (ML Service)
- Docker containers (MySQL, Redis)

## 📊 Service Status Dashboard

When you run `./start.sh`, you'll see:

```
╔════════════════════════════════════════╗
║    Poker Platform - Status Dashboard   ║
╠════════════════════════════════════════╣
║ MySQL (3306)           ✓ Running        ║
║ Redis (6379)           ✓ Running        ║
║ Backend (3000)         ✓ Running        ║
║ Web UI (4200)          ✓ Running        ║
║ ML Service (5000)      ✓ Running        ║
╠════════════════════════════════════════╣
║ Logs: .logs/
╚════════════════════════════════════════╝
```

## 🔍 Logs Location

All service logs are written to `.logs/`:
- `.logs/backend.log` — NestJS backend logs
- `.logs/web.log` — Angular dev server logs
- `.logs/ml.log` — Python Flask API logs

**View logs in real-time:**
```bash
# Watch all logs
tail -f .logs/*.log

# Watch specific service
tail -f .logs/backend.log
```

## 🛠️ Troubleshooting

### "Command not found" error

Make sure scripts are executable:
```bash
chmod +x start.sh stop.sh status.sh
```

### MySQL won't start

Check if port 3306 is already in use:
```bash
lsof -i :3306
```

Skip Docker and use existing MySQL:
```bash
./start.sh --no-docker
```

### Port already in use

Find and kill the process:
```bash
# Kill all Node processes
pkill -f node

# Kill all Python processes
pkill -f python

# Stop Docker services
docker-compose down
```

### Services not starting

Enable verbose mode to see errors:
```bash
./start.sh --dev  # Runs in development mode with logging
```

Check logs:
```bash
tail -f .logs/*.log
```

## 🔄 Common Workflows

### Development Setup
```bash
# Start everything
./start.sh --dev

# In another terminal, check status
./status.sh

# Edit code in your editor, changes auto-reload
```

### Check Before Deployment
```bash
./start.sh --check-only
```

### Clean Restart
```bash
./stop.sh
sleep 2
./start.sh
```

### Stop During Development
```bash
./stop.sh
```

## 📝 Environment Setup

Before running scripts, create `.env` files if they don't exist:

```bash
# Backend
cp poker_backend/.env.example poker_backend/.env

# ML Service
cp poker_learner/.env.example poker_learner/.env

# Mobile (optional)
cp poker_mobile/.env.example poker_mobile/.env
```

Edit `.env` files to customize:
- Database credentials
- OAuth app IDs/secrets
- Service URLs
- Game parameters

## 🐳 Docker Specific

### View running containers
```bash
docker-compose ps
```

### View container logs
```bash
docker-compose logs -f mysql
docker-compose logs -f redis
```

### Restart Docker services only
```bash
docker-compose restart
```

### Full cleanup (including volumes)
```bash
docker-compose down -v
```

## 📞 Support

Check the main [README.md](README.md) or [ARCHITECTURE.md](ARCHITECTURE.md) for more details on each service.
