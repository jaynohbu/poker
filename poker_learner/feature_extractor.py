"""
Feature Extractor: Convert raw game actions into ML-ready features

Extracts features from game_actions table:
- Position-based metrics
- Hand strength (equity calculations)
- Pot odds, implied odds
- Bet sizing patterns
- Player aggression levels
- Timing patterns
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any


def extract_features(game_id: int, game_actions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extract ML features from a complete game's actions.
    
    Args:
        game_id: Game identifier
        game_actions: List of action records from database
    
    Returns:
        Dictionary of extracted features per action
    """
    features = {
        'game_id': game_id,
        'actions': []
    }
    
    for action in game_actions:
        action_features = extract_action_features(action)
        features['actions'].append(action_features)
    
    return features


def extract_action_features(action: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract features from a single player action.
    
    Features:
    - position_index: 0 (small blind) to 5 (early position)
    - hand_strength: 0-1 (equity vs opponent range)
    - pot_odds: Current pot odds in decimal
    - bet_sizing_ratio: Bet size / pot size
    - aggression_level: 0 (fold) to 1 (all-in)
    - decision_time: Time taken to decide (seconds)
    """
    return {
        'position': action.get('position', -1),
        'street': action.get('street', -1),  # 0=preflop, 1=flop, 2=turn, 3=river
        'action_type': action.get('action_type', 'unknown'),  # fold/call/raise/check
        'amount': float(action.get('amount', 0)),
        'pot_size': float(action.get('pot_size', 0)),
        'hand_strength': float(action.get('hand_strength', 0.5)),  # placeholder
        'decision_time': float(action.get('decision_time', 0)),
        'stack_size': float(action.get('stack_size', 0)),
        'opponent_stack': float(action.get('opponent_stack', 0)),
    }


def calculate_hand_equity(hole_cards: List[str], community_cards: List[str], 
                          opponent_range: List[List[str]]) -> float:
    """
    Calculate hand equity vs opponent range.
    
    Args:
        hole_cards: ['As', 'Ks'] format
        community_cards: Community board
        opponent_range: List of possible opponent hands
    
    Returns:
        Equity as float 0-1
    """
    # Placeholder: In production, use actual equity calculator (e.g., PyPokerEngine)
    # For now, simple heuristic
    if not hole_cards or len(hole_cards) < 2:
        return 0.5
    
    # Very simple heuristic: high cards = higher equity
    card_values = {'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, '9': 9, '8': 8}
    values = [card_values.get(card[0], 5) for card in hole_cards]
    equity = (sum(values) / 28.0) * 0.5 + 0.25  # Scale to 0-1
    
    return min(1.0, max(0.0, equity))


def normalize_features(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize features for ML model input.
    
    Standardizes features to mean=0, std=1 for stable training.
    """
    normalized = features.copy()
    
    if 'actions' in features:
        actions_df = pd.DataFrame(features['actions'])
        
        # Normalize numerical columns
        for col in ['amount', 'pot_size', 'hand_strength', 'decision_time', 'stack_size']:
            if col in actions_df.columns:
                mean = actions_df[col].mean()
                std = actions_df[col].std() or 1.0  # Avoid division by zero
                actions_df[col] = (actions_df[col] - mean) / std
        
        normalized['actions'] = actions_df.to_dict('records')
    
    return normalized
