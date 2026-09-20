# Poker Platform - System Architecture

## High-Level Overview

The poker platform is a three-service microarchitecture with a **WebView-based hybrid frontend**:

```
┌──────────────────────────────────────────────────────────────┐
│        Mobile Layer (React Native WebView Wrapper)           │
│                    (poker_mobile)                            │
│           - iOS/Android native shell (EAS builds)            │
│           - Embeds WebView component                         │
└──────────────┬───────────────────────────────────────────────┘
               │
        ┌──────▼──────────────┐
        │ Angular Web UI      │
        │  (poker_web)        │
        │ - Game table UI     │
        │ - Lobby & profiles  │
        │ - i18n (Ko/En)      │
        │ - Same code for web │
        │   + iOS/Android     │
        └──────────┬──────────┘
                   │ WebSocket + HTTP
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              Backend (NestJS)                               │
│       - Auth (OAuth + JWT)                                  │
│       - Game logic orchestration                            │
│       - WebSocket gateway (real-time updates)               │
│       - Data logging (game actions)                         │
│       - API endpoints (rooms, users, tournaments)           │
└──────────────┬──────────────────────────────────────────────┘
               │ SQL + HTTP calls
               │
       ┌───────┴───────┐
       │               │
┌──────▼────────┐  ┌──▼──────────────────┐
│  MySQL        │  │ Python ML Service   │
│  - Users      │  │  - Feature extract  │
│  - Games      │  │  - Player profiles  │
│  - Actions    │  │  - Model training   │
│  - Profiles   │  │  - Inference API    │
│  - Models     │  │  (Flask)            │
└───────────────┘  └─────────────────────┘
```

## Service Architecture

### 1. Frontend Architecture (poker_mobile + poker_web)

**Technology**: React Native WebView wrapper + Angular UI

**Layout**:
```
poker_mobile/          [React Native thin wrapper]
    ↓
WebView Component (App.tsx)
    ↓
poker_web/             [Angular app - same code for web + mobile]
    ├── Web browser: http://localhost:4200
    └── iOS/Android: Embedded in WebView via EAS native build
```

**poker_mobile (React Native)**:
- Thin native wrapper providing platform-specific features
- WebView component loads Angular app from `REACT_APP_WEB_URL`
- Native bridge for camera/sensors/deep links (if needed)
- EAS builds for native iOS (.ipa) and Android (.apk)
- No native UI code—all UI is in Angular

**poker_web (Angular)**:
- Single web application running in browser AND WebView
- Game UI components (game table, lobby, profiles)
- Real-time WebSocket connection to backend
- Multi-language support (Korean primary, English fallback)
- Responsive design works on desktop, tablet, mobile
- Built once, deployed to:
  - Web: Standard Angular deploy
  - iOS: Bundled in poker_mobile + EAS build
  - Android: Bundled in poker_mobile + EAS build

**Responsibilities (Combined)**:
- User interface (game table, lobby, profiles, leaderboards)
- Real-time WebSocket connection to backend
- Language localization (Korean/English)
- Responsive design (desktop, tablet, mobile)
- Authentication (OAuth login, JWT token storage)

**Key Files (poker_web)**:
- `src/app/` — Main Angular components and services
- `src/app/services/` — GameClient, PokerEngine, MLOpponent services
- `src/app/components/` — GameTable, Lobby, PlayerProfile, etc.
- `src/assets/i18n/` — ko.json (Korean), en.json (English)
- `src/main.ts` — Angular bootstrap

**Key Files (poker_mobile)**:
- `App.tsx` — WebView wrapper that loads Angular app
- `app.json` — Native app metadata (bundle IDs, app name, version)
- `eas.json` — EAS Build configuration for native compilation

**Communication Flow**:

```
User Input (Angular UI)
    ↓
WebSocket Client (GameClient service)
    ↓
NestJS Backend WebSocket Gateway
    ↓
Game Logic + AI Decision (ML service call)
    ↓
NestJS sends game state back to Angular
    ↓
Angular renders updated UI (animations, pot, community cards)
```

**Communication Protocols**:
- HTTP: OAuth login, tournament signup, user profiles
- WebSocket: Real-time game events (join, action, state update, end)
- Both use JWT tokens for authentication

---

### 2. Backend (poker_backend)

**Technology**: NestJS (TypeScript)

**Responsibilities**:
- Game orchestration and state management
- WebSocket gateway for real-time multiplayer
- User authentication (OAuth 2.0, JWT)
- Database persistence
- Logging all game actions to database
- API for tournaments, profiles, leaderboards
- Calls ML service for AI action decisions

**Module Structure**:

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── oauth.strategy.ts
│   └── jwt.strategy.ts
│
├── game/
│   ├── game.module.ts
│   ├── game.gateway.ts         # WebSocket events
│   ├── game.service.ts         # Game logic
│   ├── game-manager.service.ts
│   ├── room-manager.service.ts
│   └── game.entity.ts
│
├── player/
│   ├── player.module.ts
│   ├── player.controller.ts
│   ├── player.service.ts
│   └── player.entity.ts
│
├── tournament/
│   ├── tournament.module.ts
│   ├── tournament.controller.ts
│   ├── tournament.service.ts
│   └── tournament.entity.ts
│
├── data-logger/
│   ├── data-logger.module.ts
│   └── data-logger.service.ts  # Logs game_actions
│
├── ml-client/
│   ├── ml-client.module.ts
│   └── ml-client.service.ts    # Calls Python ML service
│
├── database/
│   ├── database.module.ts
│   └── typeorm.config.ts
│
└── main.ts
```

**Database Entities**:
- `User` — Player accounts, OAuth profiles
- `Game` — Game records, results
- `GameAction` — Every action (fold/call/raise)
- `HandRecord` — Complete hand data
- `PlayerProfile` — Computed player stats
- `MLModel` — Trained model metadata
- `Tournament` — Tournament data

**WebSocket Events**:
```typescript
// Client → Server
player:join
player:action       // Fold, call, raise, etc.
player:leave

// Server → Client
game:state-update   // New community cards, pot, turn
game:end            // Winner, payouts
player:joined       // New player seated
player:left         // Player left table
```

**ML Service Integration**:
```typescript
// When AI's turn:
const decision = await this.mlClient.predictAction({
  gameState,
  playerProfile,
  modelName: 'self_play_v1'
});
// Returns: { action: 'raise', amount: 50, confidence: 0.87 }
```

---

### 3. ML Service (poker_learner)

**Technology**: Python (TensorFlow + Stable-Baselines3)

**Responsibilities**:
- Extract ML features from game_actions table
- Build and maintain player profiles
- Train RL models (self-play + opponent modeling)
- Serve model predictions via Flask API
- Auto-retrain models on schedule
- Cache models for fast inference

**Architecture**:

```
poker_learner/
├── feature_extractor.py     # Convert game_actions → ML features
├── player_profiler.py       # Compute VPIP, PFR, aggression, etc.
├── poker_env.py             # Gymnasium RL environment
├── train.py                 # Train RL models (PPO/DQN)
├── model_inference.py       # Load models, predict actions
├── training_pipeline.py     # Scheduled retraining
├── app.py                   # Flask API server
├── models/                  # Saved models (e.g., self_play_v1.zip)
└── requirements.txt         # Dependencies
```

**ML Feature Vector** (input to model):
- Hand strength (0-1)
- Position (0-1, normalized)
- Pot odds (0-1)
- Player stack ratio
- Opponent stack ratio
- Player VPIP (historical)
- Player PFR (historical)
- Aggression factor
- Tilt indicator (-1 to 1)

**Action Output**:
- 0: fold
- 1: call
- 2: raise_small (50% pot)
- 3: raise_large (2x pot)
- 4: all_in

**Training Modes**:

1. **Self-Play**: 
   - Agents train against each other
   - Learns optimal poker strategy
   - Weekly (100k+ timesteps)
   - Model: `self_play_v1`, `self_play_v2`, etc.

2. **Opponent Modeling**:
   - Fine-tune on specific player profiles
   - Learns to predict/counter player strategies
   - Per-player model: `opponent_player_42_v1`
   - Faster training (10k timesteps)

3. **Incremental Learning**:
   - Update model weights after each game
   - Uses behavioral cloning (supervised learning)
   - Real-time, lightweight
   - Fast feedback loop

4. **Periodic Retraining**:
   - Full retraining on all historical data
   - Nightly (or weekly)
   - 24-48 hour training time
   - Improves overall model quality

**Flask API Endpoints**:

```
POST /predict
├── Input: { game_state, player_profile, model_name }
└── Output: { action, amount, confidence }

POST /profile
├── Input: { player_id, game_actions }
└── Output: { vpip, pfr, aggression, ... }

POST /features
├── Input: { game_id, game_actions }
└── Output: { actions: [{ position, action_type, ... }] }

POST /train
├── Input: { mode, recent_games, model_name }
└── Output: { status: 'training_started' }

GET /models
└── Output: { models: ['self_play_v1', 'self_play_v2', ...] }
```

---

## Data Flow

### Game Action Logging

```
1. Player acts (fold/call/raise)
   ↓
2. NestJS game service processes action
   ├── Update pot, stacks, board state
   ├── Validate action (legal moves)
   └── Log action to DataLoggerService
   ↓
3. DataLoggerService stores action
   ├── game_id, player_id, action_type, amount
   ├── position, street, timing, hand_strength
   ├── community_cards, hole_cards (encrypted)
   └── INSERT INTO game_actions
   ↓
4. Broadcast game state update to all players (WebSocket)
   ├── New community cards, pot, turn order
   └── players: { name, stack, status }
```

### Model Training Pipeline

```
1. Scheduler triggers every 24 hours
   ↓
2. Extract all games from last 24 hours
   ├── SELECT game_actions WHERE created_at > NOW() - INTERVAL '24h'
   ├── ~1000-5000 actions per day
   └── Convert to feature vectors
   ↓
3. Build player profiles
   ├── Aggregate per player
   ├── Calculate VPIP, PFR, aggression
   └── UPDATE player_profiles
   ↓
4. Train models
   ├── Incremental: 10k steps, behavioral cloning (15 min)
   ├── Periodic: 100k+ steps, full RL training (4-6 hours)
   └── Save to models/ + database
   ↓
5. Evaluate new model
   ├── Compare win rate vs production model
   ├── If better: promote to production
   └── If worse: keep previous version (rollback)
```

### AI Decision Flow

```
1. Human player's turn ends
   ↓
2. AI player's turn (controlled by NestJS)
   ├── Check if AI has player profile
   ├── Determine difficulty level (easy/medium/hard)
   └── Call ML service
   ↓
3. ML Service (Python)
   ├── Load model from cache (or disk)
   ├── Convert game state → feature vector
   ├── Model.predict(features)
   ├── Decode output (fold/call/raise)
   └── Return { action, amount, confidence }
   ↓
4. NestJS executes AI action
   ├── Validate action
   ├── Log to game_actions
   ├── Update game state
   └── Broadcast to all players (WebSocket)
   ↓
5. Continue game or move to next player
```

---

## Database Schema

### Core Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100),
  oauth_id VARCHAR(255),  -- Google/GitHub ID
  oauth_provider VARCHAR(50),
  chip_balance DECIMAL(10, 2),
  total_wins INT DEFAULT 0,
  total_games INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**games**
```sql
CREATE TABLE games (
  id UUID PRIMARY KEY,
  room_id VARCHAR(100),
  status VARCHAR(50),  -- 'active', 'ended'
  players UUID[],
  pot DECIMAL(10, 2),
  winner_id UUID,
  created_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_minutes INT
);
```

**game_actions**
```sql
CREATE TABLE game_actions (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  player_id UUID REFERENCES users(id),
  action_type VARCHAR(20),  -- 'fold', 'call', 'raise', 'check'
  amount DECIMAL(10, 2),
  position INT,  -- 0-5 (button, small blind, etc.)
  street INT,  -- 0=preflop, 1=flop, 2=turn, 3=river
  hand_strength DECIMAL(3, 2),  -- 0.0-1.0 equity
  decision_time_ms INT,
  community_cards VARCHAR(20),  -- e.g., "AsKsQs"
  hole_cards_encrypted VARCHAR(255),
  created_at TIMESTAMP
);
```

**player_profiles**
```sql
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY,
  player_id UUID UNIQUE REFERENCES users(id),
  vpip DECIMAL(4, 2),  -- Voluntarily put money in pot %
  pfr DECIMAL(4, 2),   -- Preflop raise frequency %
  aggression_factor DECIMAL(5, 2),
  fold_to_aggression DECIMAL(4, 2),
  tilt_indicator DECIMAL(3, 2),  -- -1 to 1
  hands_analyzed INT,
  profile_json JSONB,  -- All detailed stats
  last_updated TIMESTAMP,
  created_at TIMESTAMP
);
```

**ml_models**
```sql
CREATE TABLE ml_models (
  id UUID PRIMARY KEY,
  model_name VARCHAR(100) UNIQUE,
  model_type VARCHAR(50),  -- 'self_play', 'opponent', etc.
  algorithm VARCHAR(50),  -- 'ppo', 'dqn', 'a2c'
  training_mode VARCHAR(50),  -- 'incremental', 'periodic'
  performance_metrics JSONB,  -- win_rate, accuracy, etc.
  trained_at TIMESTAMP,
  model_binary BYTEA,  -- Serialized model
  version INT,
  is_active BOOLEAN DEFAULT false
);
```

**tournaments**
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  status VARCHAR(50),  -- 'registration', 'active', 'completed'
  buy_in DECIMAL(10, 2),
  max_players INT,
  current_players INT,
  prize_pool DECIMAL(10, 2),
  created_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);
```

---

## Performance Considerations

### ML Inference Speed
- **Target**: < 500ms decision time
- **Optimization**:
  - Model caching (keep hot models in memory)
  - Batch inference (multiple players at once)
  - GPU acceleration (if available)
  - Model quantization (reduce size, faster inference)

### Database Optimization
- Index on `game_actions(game_id, player_id, created_at)`
- Index on `player_profiles(player_id)`
- Partition `game_actions` by date (monthly)
- Archive old games to cold storage

### Model Training Efficiency
- Parallel environment training (4 parallel games)
- Distributed training (multiple GPUs/TPUs)
- Checkpointing (save intermediate models)
- Incremental learning reduces full training frequency

---

## Security

### Authentication
- OAuth 2.0 for login (no passwords)
- JWT tokens for API/WebSocket auth
- Token expiration: 24 hours
- Refresh token rotation

### Data Protection
- Hole cards encrypted in database
- HTTPS for all API calls
- WebSocket Secure (WSS)
- Rate limiting on API endpoints

### Privacy
- Player game data not shared without consent
- Option to delete personal history
- GDPR-compliant data retention policies

---

## Scalability

### Horizontal Scaling
- **Frontend**: Deploy to CDN (Vercel/Netlify)
- **Backend**: Kubernetes/Docker Swarm (stateless NestJS services)
- **Database**: MySQL 8.0+ with read replicas, connection pooling
- **ML Service**: Multiple inference replicas, load balancing

### Vertical Scaling
- Increase server resources (CPU, RAM)
- GPU for ML training and inference
- Larger database instance

### Caching
- Redis for session data
- Model caching in ML service
- Frontend caching (service workers)

---

## Deployment

### Development
```bash
docker-compose up                    # Start MySQL
cd poker_backend && npm run start
cd poker_mobile && npm run web
cd poker_learner && python app.py
```

### Production
- **Frontend**: Vercel (React Expo Web)
- **Backend**: Railway/Heroku/AWS ECS (NestJS)
- **ML**: AWS Lambda (inference) + EC2 (training)
- **Database**: AWS RDS (MySQL 8.0+)
- **Monitoring**: Prometheus, Grafana, DataDog

---

## Monitoring & Logging

### Application Metrics
- API response times (p50, p95, p99)
- Error rates per endpoint
- WebSocket connection count
- ML model inference latency

### ML Metrics
- Model accuracy (action prediction)
- Win rate vs human players
- Training convergence
- Model size and memory usage

### Logging
- Structured JSON logs
- Log aggregation (ELK, Datadog)
- Error tracking (Sentry)
- Performance tracing (Jaeger)

---

## Future Enhancements

1. **Advanced AI**: Deep reinforcement learning (DQN, A3C)
2. **Real Money**: Payment integration, regulatory compliance
3. **Mobile Apps**: Native iOS/Android apps
4. **Video Streaming**: Live poker broadcast
5. **Tournament System**: Large-scale MTTs with blind scheduling
6. **Hand Analysis**: GTO solver integration
7. **Community Features**: Clans, rankings, achievements
8. **Customization**: Table themes, avatars, sound effects
