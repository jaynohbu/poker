# Poker Platform - Full-Stack with ML Learning

A comprehensive online Texas Hold'em poker platform with machine learning-based opponent learning. The platform consists of three main services:

- **poker_mobile**: React Native frontend (web + iOS/Android via WebView)
- **poker_backend**: NestJS backend with WebSocket multiplayer
- **poker_learner**: Python ML service for learning player behavior

## 🎯 Features

✅ **Multiplayer Poker**
- Real-time online multiplayer (2-6 players)
- Local network play
- Single-player vs AI
- Texas Hold'em rules engine

✅ **Machine Learning**
- Reinforcement learning agents (PPO/DQN)
- Player behavior profiling (VPIP, PFR, aggression)
- Self-play training and opponent modeling
- Incremental + periodic model retraining

✅ **User Features**
- OAuth authentication (Google/GitHub)
- User profiles and statistics
- Tournament system with blind progression
- Hand history and replay functionality
- Leaderboards and rankings

✅ **Multi-Language**
- Korean (primary language)
- English (secondary)
- Easy language switching

✅ **Platforms**
- Web browser (Angular + Expo)
- iOS/Android via React Native WebView
- Mobile-responsive design

## 📁 Project Structure

```
poker/
├── poker_mobile/               # React Native WebView wrapper (iOS/Android native)
│   ├── App.tsx                 # Main WebView component
│   ├── index.js                # Entry point
│   ├── app.json                # Expo config for EAS
│   ├── eas.json                # EAS Build config (iOS native, not Expo Go)
│   ├── package.json            # React Native dependencies
│   ├── .env.example            # Configuration template
│   └── assets/                 # Icons, splash screens
│
├── poker_web/                  # Angular UI (runs in WebView + web browser)
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/
│   │   │   │   ├── poker-engine.service.ts
│   │   │   │   ├── game-client.service.ts
│   │   │   │   └── ml-ai-opponent.service.ts
│   │   │   ├── components/
│   │   │   │   ├── game-table/
│   │   │   │   ├── lobby/
│   │   │   │   └── ...
│   │   │   └── app.routes.ts
│   │   ├── assets/i18n/
│   │   │   ├── ko.json (Korean - primary)
│   │   │   └── en.json (English)
│   │   └── main.ts
│   ├── package.json
│   └── angular.json
│
├── poker_backend/              # NestJS backend (API + WebSocket)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/               # OAuth, JWT
│   │   ├── game/               # Game logic, WebSocket gateway
│   │   ├── player/             # User management
│   │   ├── tournament/         # Tournament system
│   │   ├── data-logger/        # Game action logging
│   │   ├── ml-client/          # Calls Python ML service
│   │   └── database/           # MySQL ORM (TypeORM)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── poker_learner/              # Python ML service
│   ├── feature_extractor.py    # Feature engineering
│   ├── player_profiler.py      # Player profile building
│   ├── poker_env.py            # RL environment
│   ├── train.py                # Model training
│   ├── model_inference.py      # Model inference
│   ├── app.py                  # Flask API
│   ├── requirements.txt        # Dependencies
│   ├── .env.example
│   └── models/                 # Trained models
│
├── docker-compose.yml          # MySQL + services
├── README.md                   # This file
└── ARCHITECTURE.md             # System design documentation
```

## 🎮 Architecture: WebView-Based

The poker platform uses a **WebView-based hybrid architecture**:

```
┌─────────────────────────────────┐
│   iOS/Android (React Native)    │
│  (pokermobile - WebView wrapper)│
└──────────────┬──────────────────┘
               │
        ┌──────▼──────────────┐
        │ React Native WebView│
        │ (Embedded browser)  │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   Angular UI        │
        │ (poker_web: same    │
        │  as web browser)    │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  NestJS Backend     │
        │ (WebSocket + REST)  │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ MySQL + Python      │
        │   ML Service        │
        └─────────────────────┘
```

**Benefits:**
- ✅ **Single codebase**: One Angular app for web + iOS/Android
- ✅ **Native build**: EAS builds native iOS apps (not Expo Go wrapper)
- ✅ **Easy maintenance**: UI changes update everywhere instantly
- ✅ **Web-first development**: Test in browser, deploy to mobile
- ✅ **Familiar stack**: Web developers work with HTML/CSS/TS

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MySQL 8.0+ (or Docker)
- macOS/Linux (or WSL on Windows)
- For iOS: macOS + Xcode (EAS handles builds, you just need to setup signing)

### ⚡ Automated Setup (Recommended)

Use the included service management scripts to start all services automatically:

```bash
# Start all services (MySQL, Backend, Web UI, ML Service)
./start.sh

# Check service status
./status.sh

# Stop all services
./stop.sh

# Development mode with live reload
./start.sh --dev
```

See [SERVICES.md](SERVICES.md) for full script documentation.

### 1. Manual Setup - Setup poker_web (Angular UI - runs in WebView)

```bash
cd poker_web
npm install
npm run start
# Angular dev server runs on http://localhost:4200
```

### 2. Setup poker_backend (NestJS)

```bash
cd poker_backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with database URL and OAuth credentials

# Run database migrations
npm run typeorm migration:run

# Start server
npm run start
# Server runs on http://localhost:3000
```

### 3. Setup poker_learner (Python ML)

```bash
cd poker_learner

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Train a self-play model (optional)
python train.py --mode self-play --steps 100000

# Start ML API server
python app.py
# Server runs on http://localhost:5000
```

### 4. Setup poker_mobile (React Native WebView - optional, for native builds)

```bash
cd poker_mobile
npm install

# Configure environment
cp .env.example .env
# Edit .env with:
#   REACT_APP_WEB_URL=http://localhost:4200  (dev)
#   REACT_APP_API_URL=http://localhost:3000

# For iOS native build (requires EAS setup)
eas build --platform ios --local
# This builds a native iOS app (not Expo Go wrapper)

# For testing in development:
# The WebView automatically loads the Angular app from REACT_APP_WEB_URL
```

### 5. Start Docker services (MySQL)

```bash
docker-compose up -d
# MySQL running on localhost:3306
```

## 📊 Architecture

### Data Flow

1. **Player joins game** → Backend (NestJS) authenticates user
2. **Game actions** → All actions logged to MySQL via data-logger service
3. **ML pipeline** → Python ML service extracts features, builds player profiles
4. **Model training** → RL agents train on historical data (incremental + nightly)
5. **AI opponent** → NestJS calls ML service for action predictions
6. **Results persist** → Hand history stored for future learning

### ML Service Diagram

```
┌─────────────────┐
│  Real Players   │
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│   NestJS Backend         │
│  (Game Logic, Logging)   │
└─────────┬────────────────┘
          │
          ↓
┌──────────────────────────┐
│   PostgreSQL Database    │
│  (game_actions, profiles)│
└─────────┬────────────────┘
          │
          ↓
┌──────────────────────────┐
│   Python ML Service      │
│  (Feature → Profile)     │
└─────────┬────────────────┘
          │
          ↓
┌──────────────────────────┐
│   RL Training Pipeline   │
│  (PPO/DQN Models)        │
└─────────┬────────────────┘
          │
          ↓
┌──────────────────────────┐
│   AI Opponent / Inference│
│  (Predict Actions)       │
└──────────────────────────┘
```

## 🤖 Machine Learning Features

### Player Profiling
Tracks per-player stats:
- **VPIP**: % hands entering pot voluntarily
- **PFR**: % preflop raises
- **Aggression**: (raises + bets) / calls ratio
- **Fold to X-Bet**: Fold frequency to aggression
- **Position Play**: Different strategies by table position
- **Tilt Detection**: Increased aggression after losses

### Model Training
- **Self-Play**: Agents learn optimal poker (PPO/DQN)
- **Opponent Modeling**: Learn specific player strategies
- **Incremental Learning**: Update after each game (behavioral cloning)
- **Periodic Retraining**: Full training nightly (computationally intensive)

### Inference Speed
- Target: < 500ms decision time (human-like response)
- Uses model caching for performance
- Falls back to heuristic if model unavailable

## 🗄️ Database Schema

Key tables:
- `users` — Player accounts, OAuth data, chip balance
- `games` — Game records, results, timestamps
- `game_actions` — Every action (fold/call/raise), amounts, timing
- `hand_records` — Complete hand data (cards, result, winner)
- `player_profiles` — Computed player statistics
- `ml_models` — Trained model metadata and binaries
- `tournaments` — Tournament data, payouts, standings

## 🔐 Authentication

- **OAuth 2.0**: Google, GitHub login
- **JWT Tokens**: Stateless session management
- **WebSocket Auth**: JWT verification for game connections

## 📱 API Endpoints

### Backend (NestJS)
- `POST /auth/oauth/callback` — OAuth login
- `POST /rooms` — Create game room
- `GET /rooms` — List active rooms
- `WS /game/:roomId` — WebSocket game connection
- `GET /user/:id/profile` — User stats
- `GET /tournaments` — Tournament list

### ML Service (Python)
- `POST /predict` — Predict next action
- `POST /profile` — Get/update player profile
- `POST /features` — Extract game features
- `POST /train` — Trigger training
- `GET /models` — List available models

## 🎮 Game Modes

1. **Single-Player**: vs AI opponent
2. **Local Multiplayer**: Same device/network
3. **Online Multiplayer**: Real-time with friends
4. **Tournament**: Single/multi-table with blind progression

## 📊 Metrics & Monitoring

Track:
- **Model Performance**: Win rate %, prediction accuracy
- **Game Stats**: Player win rate, profit, volatility
- **System Health**: API response times, training duration, model convergence

## 🧪 Testing

```bash
# Frontend tests
cd poker_mobile
npm test

# Backend tests
cd poker_backend
npm test

# ML tests
cd poker_learner
pytest tests/
```

## 🚢 Deployment

### Development
- Frontend: `npm run dev` (localhost:3000)
- Backend: `npm run start` (localhost:3001)
- ML: `python app.py` (localhost:5000)

### Production
- Frontend: Deploy to Vercel/Netlify (React Expo web)
- Backend: Deploy to Railway/Heroku (NestJS)
- ML: Deploy to AWS Lambda or dedicated server (Python)
- Database: Managed PostgreSQL (AWS RDS, DigitalOcean, etc.)

## 🛣️ Roadmap

### Phase 1-5: MVP (Weeks 1-3)
- [x] Game logic + data logging
- [x] Single-player UI + simple AI
- [ ] RL model training
- [ ] Backend + online multiplayer
- [ ] Database persistence

### Phase 6-10: Core Features (Weeks 4-5)
- [ ] Local multiplayer
- [ ] ML-based AI opponent
- [ ] Tournaments
- [ ] Hand history + replay
- [ ] Leaderboards

### Phase 11-13: Polish (Weeks 6)
- [ ] Multi-language support
- [ ] WebView integration
- [ ] Performance optimization
- [ ] Testing + bug fixes

## 📚 Documentation

- [Backend Architecture](poker_backend/README.md)
- [ML Service Guide](poker_learner/README.md)
- [Frontend Guide](poker_mobile/README.md)
- [Database Schema](./ARCHITECTURE.md)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push branch: `git push origin feature/your-feature`
4. Create Pull Request

## 📄 License

MIT

## 🆘 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Refer to project ARCHITECTURE.md for system design

---

**Happy poker coding! 🎰**
# poker
