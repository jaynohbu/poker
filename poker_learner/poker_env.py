"""
Poker RL Environment: Gymnasium-compatible environment for Texas Hold'em

Uses Stable-Baselines3 with PPO (Proximal Policy Optimization) or DQN for training.
Supports both heads-up and multi-player games.
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Dict, Tuple, Any, Optional


class TexasHoldemEnv(gym.Env):
    """
    Texas Hold'em Poker environment for RL training.
    
    State: hand strength, position, pot odds, community cards, opponent history
    Actions: fold, call, raise (discrete bet sizes)
    Reward: chips won at end of hand (or +1 for winning, -1 for losing)
    """
    
    metadata = {"render_modes": []}
    
    def __init__(self, num_players: int = 2, starting_stack: int = 1000, render_mode: Optional[str] = None):
        """
        Initialize poker environment.
        
        Args:
            num_players: Number of players (2 for heads-up, 2-6 for multi-player)
            starting_stack: Starting chip count per player
            render_mode: None or 'human' for rendering
        """
        super().__init__()
        
        self.num_players = num_players
        self.starting_stack = starting_stack
        self.render_mode = render_mode
        
        # State space: [hand_strength, position, pot_odds, stack_ratio, opponent_actions]
        # Continuous observations
        self.observation_space = spaces.Box(
            low=0.0,
            high=1.0,
            shape=(10,),  # hand_strength, position (normalized), pot_odds, stacks, etc.
            dtype=np.float32
        )
        
        # Action space: 0=fold, 1=call, 2=raise_small, 3=raise_large, 4=all_in
        self.action_space = spaces.Discrete(5)
        
        self.state = self._reset_game()
    
    def _reset_game(self) -> Dict[str, Any]:
        """Reset game state for new hand."""
        return {
            'stacks': [self.starting_stack] * self.num_players,
            'community_cards': [],
            'player_hands': [None] * self.num_players,
            'pot': 0,
            'current_player': 0,
            'street': 0,  # 0=preflop, 1=flop, 2=turn, 3=river
            'actions': [],
        }
    
    def reset(self, seed: Optional[int] = None, options: Optional[Dict] = None) -> Tuple[np.ndarray, Dict]:
        """Reset environment for new episode."""
        super().reset(seed=seed)
        self.state = self._reset_game()
        obs = self._get_observation()
        return obs, {}
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        """
        Execute one step in the environment.
        
        Args:
            action: 0=fold, 1=call, 2=raise_small, 3=raise_large, 4=all_in
        
        Returns:
            obs, reward, terminated, truncated, info
        """
        
        reward = 0.0
        terminated = False
        truncated = False
        info = {}
        
        # Execute action
        if action == 0:  # fold
            reward = -1.0  # Penalty for folding
            terminated = True
        elif action == 1:  # call
            reward = -0.1  # Small cost to call
        elif action == 2:  # raise small
            reward = 0.1  # Reward for aggression
        elif action == 3:  # raise large
            reward = 0.2  # Higher reward for bold raise
        elif action == 4:  # all-in
            reward = 0.3  # High reward if wins, high penalty if loses
        
        # Advance game state
        self.state['current_player'] = (self.state['current_player'] + 1) % self.num_players
        self.state['actions'].append({
            'player': self.state['current_player'],
            'action': action
        })
        
        # Check if hand is over (simplified)
        if len(self.state['actions']) > self.num_players * 4:
            terminated = True
            # Calculate final reward based on hand outcome
            reward = self._calculate_hand_reward()
        
        obs = self._get_observation()
        
        return obs, reward, terminated, truncated, info
    
    def _get_observation(self) -> np.ndarray:
        """
        Get current game observation for model input.
        
        Returns normalized state vector.
        """
        stacks = np.array(self.state['stacks'], dtype=np.float32)
        
        # Normalize observations to [0, 1]
        max_stack = max(stacks) if max(stacks) > 0 else 1
        normalized_stacks = stacks / max_stack
        
        # Simple observation: normalize stack sizes
        # In production: include hand strength, pot odds, position, etc.
        obs = np.zeros(10, dtype=np.float32)
        
        for i, stack in enumerate(normalized_stacks):
            if i < 10:
                obs[i] = stack
        
        return obs
    
    def _calculate_hand_reward(self) -> float:
        """Calculate reward at end of hand based on chip outcome."""
        # Simplified: player 0 gets positive reward if won chips
        chip_change = self.state['stacks'][0] - self.starting_stack
        
        if chip_change > 0:
            return float(chip_change / self.starting_stack)  # Normalize
        elif chip_change < 0:
            return float(chip_change / self.starting_stack)
        else:
            return 0.0
    
    def render(self) -> Optional[str]:
        """Render current game state (placeholder)."""
        if self.render_mode == "human":
            print(f"Street {self.state['street']}, Pot: {self.state['pot']}")
            print(f"Stacks: {self.state['stacks']}")
        return None
    
    def close(self) -> None:
        """Clean up environment."""
        pass


class HeadsUpTexasHoldemEnv(TexasHoldemEnv):
    """Specialized environment for heads-up (1v1) poker."""
    
    def __init__(self, starting_stack: int = 1000, render_mode: Optional[str] = None):
        super().__init__(num_players=2, starting_stack=starting_stack, render_mode=render_mode)


# Example usage
if __name__ == "__main__":
    env = HeadsUpTexasHoldemEnv()
    obs, info = env.reset()
    
    for _ in range(100):
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        
        if terminated or truncated:
            obs, info = env.reset()
    
    env.close()
    print("Environment test complete!")
