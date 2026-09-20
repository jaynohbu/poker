"""
Model Inference: Load and use trained models for action prediction

Supports loading different model versions and returning action predictions.
"""

import os
import numpy as np
from typing import Dict, Any, Optional
from stable_baselines3 import PPO, DQN

from player_profiler import PlayerProfile


# Model cache for performance
_model_cache = {}


def load_model(model_name: str, model_path: str = "./models", force_reload: bool = False):
    """
    Load trained model from disk.
    
    Args:
        model_name: Name of model (e.g., "self_play_v1")
        model_path: Directory containing models
        force_reload: Force reload even if cached
    
    Returns:
        Loaded model object
    """
    
    global _model_cache
    
    # Check cache
    if model_name in _model_cache and not force_reload:
        return _model_cache[model_name]
    
    # Build full path
    full_path = os.path.join(model_path, model_name)
    
    if not os.path.exists(full_path + ".zip"):
        raise FileNotFoundError(f"Model not found: {full_path}")
    
    # Load model (auto-detect type)
    try:
        # Try PPO first (most common)
        model = PPO.load(full_path)
    except:
        try:
            # Try DQN
            model = DQN.load(full_path)
        except:
            raise ValueError(f"Could not load model: {model_name}")
    
    # Cache model
    _model_cache[model_name] = model
    
    return model


def predict_action(
    game_state: Dict[str, Any],
    player_profile: Optional[Dict[str, Any]] = None,
    model_name: str = "self_play_v1",
    model_cache: Dict = None,
) -> Dict[str, Any]:
    """
    Predict next action given game state and player profile.
    
    Args:
        game_state: Current game state (hand, community cards, pot, etc.)
        player_profile: Player's historical stats (VPIP, PFR, etc.)
        model_name: Name of model to use
        model_cache: Cache dict to reuse loaded models
    
    Returns:
        {
            "action": "fold" | "call" | "raise" | "check" | "all_in",
            "amount": int or null,
            "confidence": float (0-1),
            "model": model_name,
        }
    """
    
    try:
        # Load model
        model = load_model(model_name)
        
        # Convert game state to observation vector
        obs = _game_state_to_observation(game_state, player_profile)
        obs = np.array(obs, dtype=np.float32)
        
        # Predict action
        action, _states = model.predict(obs, deterministic=True)
        action = int(action)
        
        # Decode action
        result = _decode_action(action, game_state)
        result['model'] = model_name
        
        return result
    
    except Exception as e:
        # Fallback: return random action
        print(f"⚠️  Prediction error: {str(e)}, using fallback")
        return {
            "action": "call",
            "amount": None,
            "confidence": 0.5,
            "error": str(e),
            "model": model_name,
        }


def _game_state_to_observation(game_state: Dict[str, Any], player_profile: Optional[Dict] = None) -> list:
    """
    Convert game state dict to observation vector for model.
    
    Observation includes:
    - Hand strength (0-1)
    - Position (normalized)
    - Pot odds (0-1 scaled)
    - Stack ratio (0-1)
    - Player history (if profile available)
    """
    
    obs = []
    
    # Hand strength (0-1)
    hand_strength = game_state.get('hand_strength', 0.5)
    obs.append(float(hand_strength))
    
    # Position (0-5 normalized to 0-1)
    position = game_state.get('position', 0)
    obs.append(float(position) / 6.0)
    
    # Pot odds
    pot = float(game_state.get('pot', 0))
    cost_to_call = float(game_state.get('cost_to_call', 0))
    pot_odds = (cost_to_call / (pot + cost_to_call)) if (pot + cost_to_call) > 0 else 0.5
    obs.append(min(1.0, pot_odds))
    
    # Stack sizes (normalized)
    player_stack = float(game_state.get('player_stack', 1000))
    opponent_stack = float(game_state.get('opponent_stack', 1000))
    max_stack = max(player_stack, opponent_stack, 1.0)
    obs.append(player_stack / max_stack)
    obs.append(opponent_stack / max_stack)
    
    # Player profile stats (if available)
    if player_profile:
        obs.append(float(player_profile.get('vpip', 0.25)))  # Typically 15-40%
        obs.append(float(player_profile.get('pfr', 0.18)))   # Typically 10-25%
        obs.append(float(player_profile.get('aggression_factor', 1.0)))
        obs.append(float(player_profile.get('tilt_indicator', 0.0)))  # -1 to 1
    else:
        # Default neutral values
        obs.extend([0.25, 0.18, 1.0, 0.0])
    
    # Pad to size 10 if needed
    while len(obs) < 10:
        obs.append(0.0)
    
    return obs[:10]  # Ensure exactly 10 elements


def _decode_action(action_idx: int, game_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Decode action index (0-4) into action name and amount.
    
    Actions:
    0: fold
    1: call
    2: raise small
    3: raise large
    4: all-in
    """
    
    action_names = ["fold", "call", "raise_small", "raise_large", "all_in"]
    action = action_names[min(action_idx, len(action_names) - 1)]
    
    amount = None
    confidence = 0.85
    
    if action == "call":
        amount = game_state.get('cost_to_call', 0)
    elif action == "raise_small":
        pot = game_state.get('pot', 0)
        amount = int(pot * 0.5)  # Raise 50% of pot
        confidence = 0.80
    elif action == "raise_large":
        pot = game_state.get('pot', 0)
        amount = int(pot * 2.0)  # Raise 2x pot
        confidence = 0.75
    elif action == "all_in":
        amount = game_state.get('player_stack', 1000)
        confidence = 0.70
    
    return {
        "action": action,
        "amount": amount,
        "confidence": confidence,
    }


def clear_model_cache() -> None:
    """Clear cached models to free memory."""
    global _model_cache
    _model_cache.clear()


def get_cached_models() -> list:
    """Return list of cached model names."""
    global _model_cache
    return list(_model_cache.keys())
