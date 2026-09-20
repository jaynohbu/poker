# Poker ML Learning Service

Python-based machine learning service for learning player behavior in poker games. Uses reinforcement learning (RL) to train agents that can adapt to individual player strategies.

## Features

- **Feature Extraction**: Convert raw game actions into ML-ready features (position, hand equity, pot odds, bet sizing patterns)
- **Player Profiling**: Build player behavior profiles (VPIP, PFR, aggression, tilt detection)
- **RL Training**: Train agents using PPO/DQN (Stable-Baselines3)
- **Self-Play**: Agents learn optimal poker play by playing against each other
- **Opponent Modeling**: Learn to predict and counter specific player strategies
- **Incremental Learning**: Update models after each game via behavioral cloning
- **Model Inference**: Serve trained models via Flask API

## Setup

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # macOS/Linux
   # or
   venv\Scripts\activate  # Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with database credentials, model paths, etc.
   ```

## Project Structure

```
poker_learner/
├── feature_extractor.py         # Extract ML features from game_actions
├── player_profiler.py           # Build player profiles from historical data
├── poker_env.py                 # Gym environment for RL
├── train.py                     # Train RL models (self-play + opponent modeling)
├── training_pipeline.py         # Scheduled nightly retraining
├── model_inference.py           # Load and inference models
├── app.py                       # Flask API server
├── models/                      # Saved trained models
├── data/                        # Training datasets
├── venv/                        # Python virtual environment
├── requirements.txt             # Dependencies
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## Usage

### Extract Features
```python
from feature_extractor import extract_features

# From database game_actions table
features = extract_features(game_id=123)
```

### Train RL Models
```bash
python train.py --mode self-play --steps 100000 --save-path models/self_play_v1
```

### Inference (Predict Next Action)
```python
from model_inference import predict_action

action = predict_action(game_state, player_profile, model_name='self_play_v1')
# Returns: {'action': 'raise', 'amount': 50, 'confidence': 0.87}
```

### Start Flask API
```bash
python app.py
# Server runs on http://localhost:5000
```

## API Endpoints

- **POST /predict** — Predict next player action
  ```json
  {
    "game_state": {...},
    "player_profile": {...},
    "model_name": "self_play_v1"
  }
  ```

- **POST /profile** — Get player profile from history
  ```json
  {
    "player_id": 42
  }
  ```

- **POST/train** — Trigger training (internal use)
  ```json
  {
    "mode": "incremental",
    "recent_games": 50
  }
  ```

## Training Modes

1. **Self-Play**: Agents train against each other to learn optimal poker
2. **Opponent Modeling**: Learn specific player strategies from historical games
3. **Incremental**: Update weights after each game (fast, lightweight)
4. **Periodic**: Full retraining on all historical data (nightly, computationally expensive)

## Model Performance

Track these metrics:
- **Accuracy**: Predict next action correctly (target > 60%)
- **Win Rate**: Win % vs human players (target > 52%)
- **Convergence**: Model improves or maintains performance across retrainings

## Dependencies

- **TensorFlow/PyTorch**: Deep learning frameworks
- **Stable-Baselines3**: RL algorithms (PPO, DQN, A2C)
- **Gymnasium**: RL environment toolkit
- **Pandas/NumPy**: Data processing
- **Scikit-learn**: ML utilities
- **Flask**: API server

## Environment Variables

See `.env.example` for required variables:
- `DATABASE_URL`: MySQL connection string
- `MODEL_PATH`: Directory to save/load models
- `FLASK_PORT`: API server port (default 5000)
- `LOG_LEVEL`: Logging verbosity

## Development

Run tests:
```bash
pytest tests/
```

Generate coverage:
```bash
pytest --cov=. tests/
```

## License

MIT
