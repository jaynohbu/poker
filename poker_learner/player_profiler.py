"""
Player Profiler: Build player behavior profiles from historical game data

Aggregates statistics per player:
- VPIP (voluntarily put money in pot)
- PFR (preflop raise frequency)
- Aggression factor
- Fold to aggression
- Showdown statistics
- Tilt detection
- Hand range estimates
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from enum import Enum
import math


class PokerPosition(Enum):
    """Poker table positions"""
    SMALL_BLIND = 0
    BIG_BLIND = 1
    EARLY = 2
    MIDDLE = 3
    CUTOFF = 4
    BUTTON = 5


@dataclass
class PlayerProfile:
    """Player behavior profile"""
    player_id: int
    total_hands: int
    
    # Basic stats
    win_rate: float  # win % of played hands
    hands_played: int  # VPIP
    hands_raised: int  # PFR
    
    # Aggression metrics
    aggression_factor: float  # (raises + bets) / calls
    aggression_by_street: Dict[str, float]  # agg_factor per street
    
    # Fold rates
    fold_to_aggression: float
    fold_to_3bet: float
    fold_to_cbet: float  # continuation bet
    
    # Position play
    position_stats: Dict[str, Dict[str, float]]  # vpip/pfr/agg per position
    
    # Advanced
    showdown_winrate: float
    non_showdown_winrate: float
    tilt_indicator: float  # -1 to 1, positive = tilted
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert profile to dictionary for storage"""
        return {
            'player_id': self.player_id,
            'total_hands': self.total_hands,
            'win_rate': self.win_rate,
            'hands_played': self.hands_played,
            'hands_raised': self.hands_raised,
            'aggression_factor': self.aggression_factor,
            'aggression_by_street': self.aggression_by_street,
            'fold_to_aggression': self.fold_to_aggression,
            'fold_to_3bet': self.fold_to_3bet,
            'fold_to_cbet': self.fold_to_cbet,
            'position_stats': self.position_stats,
            'showdown_winrate': self.showdown_winrate,
            'non_showdown_winrate': self.non_showdown_winrate,
            'tilt_indicator': self.tilt_indicator,
        }


def build_player_profile(player_id: int, game_actions: List[Dict[str, Any]]) -> PlayerProfile:
    """
    Build comprehensive player profile from game actions.
    
    Args:
        player_id: Player identifier
        game_actions: List of all actions taken by this player
    
    Returns:
        PlayerProfile object
    """
    
    # Filter actions for this player
    player_actions = [a for a in game_actions if a.get('player_id') == player_id]
    
    if not player_actions:
        return PlayerProfile(
            player_id=player_id,
            total_hands=0,
            win_rate=0.0,
            hands_played=0,
            hands_raised=0,
            aggression_factor=0.0,
            aggression_by_street={},
            fold_to_aggression=0.0,
            fold_to_3bet=0.0,
            fold_to_cbet=0.0,
            position_stats={},
            showdown_winrate=0.0,
            non_showdown_winrate=0.0,
            tilt_indicator=0.0,
        )
    
    # Calculate metrics
    total_hands = len(set(a['game_id'] for a in player_actions))
    hands_played = len([a for a in player_actions if a['action_type'] != 'fold'])
    hands_raised = len([a for a in player_actions if a['action_type'] == 'raise'])
    
    raises = len([a for a in player_actions if a['action_type'] == 'raise'])
    bets = len([a for a in player_actions if a['action_type'] == 'bet'])
    calls = len([a for a in player_actions if a['action_type'] == 'call'])
    
    aggression_factor = (raises + bets) / max(calls, 1)
    
    # Position-specific stats
    position_stats = calculate_position_stats(player_actions)
    
    # Aggression by street
    aggression_by_street = calculate_aggression_by_street(player_actions)
    
    # Fold rates
    fold_to_aggression = calculate_fold_to_aggression(player_actions)
    fold_to_3bet = calculate_fold_to_3bet(player_actions)
    fold_to_cbet = calculate_fold_to_cbet(player_actions)
    
    # Win rates
    showdown_wr = calculate_showdown_winrate(player_actions)
    non_showdown_wr = calculate_non_showdown_winrate(player_actions)
    overall_wr = (showdown_wr + non_showdown_wr) / 2 if showdown_wr and non_showdown_wr else 0.5
    
    # Tilt detection
    tilt = detect_tilt(player_actions)
    
    return PlayerProfile(
        player_id=player_id,
        total_hands=total_hands,
        win_rate=overall_wr,
        hands_played=hands_played,
        hands_raised=hands_raised,
        aggression_factor=aggression_factor,
        aggression_by_street=aggression_by_street,
        fold_to_aggression=fold_to_aggression,
        fold_to_3bet=fold_to_3bet,
        fold_to_cbet=fold_to_cbet,
        position_stats=position_stats,
        showdown_winrate=showdown_wr,
        non_showdown_winrate=non_showdown_wr,
        tilt_indicator=tilt,
    )


def calculate_position_stats(actions: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
    """Calculate VPIP, PFR, and aggression per position."""
    stats = {}
    
    positions = [p.name.lower() for p in PokerPosition]
    
    for pos in positions:
        pos_actions = [a for a in actions if a.get('position') == pos]
        if not pos_actions:
            continue
        
        played = len([a for a in pos_actions if a['action_type'] != 'fold'])
        raised = len([a for a in pos_actions if a['action_type'] == 'raise'])
        
        stats[pos] = {
            'vpip': played / len(pos_actions) if pos_actions else 0.0,
            'pfr': raised / len(pos_actions) if pos_actions else 0.0,
        }
    
    return stats


def calculate_aggression_by_street(actions: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate aggression factor per street (preflop, flop, turn, river)."""
    streets = ['preflop', 'flop', 'turn', 'river']
    agg_by_street = {}
    
    for street in streets:
        street_actions = [a for a in actions if a.get('street') == street]
        if not street_actions:
            continue
        
        raises = len([a for a in street_actions if a['action_type'] == 'raise'])
        calls = len([a for a in street_actions if a['action_type'] == 'call'])
        
        agg = raises / max(calls, 1)
        agg_by_street[street] = agg
    
    return agg_by_street


def calculate_fold_to_aggression(actions: List[Dict[str, Any]]) -> float:
    """Calculate fold rate to aggression (opponent raise/bet)."""
    folds_to_agg = 0
    faced_agg = 0
    
    for i, action in enumerate(actions):
        if i > 0 and actions[i-1].get('action_type') in ['raise', 'bet']:
            faced_agg += 1
            if action.get('action_type') == 'fold':
                folds_to_agg += 1
    
    return folds_to_agg / max(faced_agg, 1)


def calculate_fold_to_3bet(actions: List[Dict[str, Any]]) -> float:
    """Calculate fold rate to 3-bet."""
    # Simplified: treat re-raise as 3-bet
    folds = 0
    faced_3bet = 0
    
    for i, action in enumerate(actions):
        if i > 1 and actions[i-1].get('action_type') == 'raise':
            faced_3bet += 1
            if action.get('action_type') == 'fold':
                folds += 1
    
    return folds / max(faced_3bet, 1)


def calculate_fold_to_cbet(actions: List[Dict[str, Any]]) -> float:
    """Calculate fold rate to continuation bet (simplified)."""
    # In production: track actual continuation bets
    return calculate_fold_to_aggression(actions) * 0.8


def calculate_showdown_winrate(actions: List[Dict[str, Any]]) -> float:
    """Calculate win rate in hands that reached showdown."""
    showdown_wins = len([a for a in actions if a.get('result') == 'win' and a.get('showdown')])
    showdown_hands = len([a for a in actions if a.get('showdown')])
    
    return showdown_wins / max(showdown_hands, 1)


def calculate_non_showdown_winrate(actions: List[Dict[str, Any]]) -> float:
    """Calculate non-showdown win rate (won by fold)."""
    non_sd_wins = len([a for a in actions if a.get('result') == 'win' and not a.get('showdown')])
    non_sd_hands = len([a for a in actions if not a.get('showdown')])
    
    return non_sd_wins / max(non_sd_hands, 1)


def detect_tilt(actions: List[Dict[str, Any]]) -> float:
    """
    Detect if player is tilted (increased aggression after losses).
    
    Returns:
        Float -1 to 1: negative = calm, positive = tilted
    """
    if len(actions) < 10:
        return 0.0
    
    recent = actions[-10:]
    earlier = actions[-30:-10] if len(actions) >= 30 else actions[:-10]
    
    recent_agg = len([a for a in recent if a['action_type'] in ['raise', 'bet']]) / len(recent)
    earlier_agg = len([a for a in earlier if a['action_type'] in ['raise', 'bet']]) / max(len(earlier), 1)
    
    tilt_score = (recent_agg - earlier_agg) * 2  # Scale to -1 to 1 range
    return max(-1.0, min(1.0, tilt_score))
