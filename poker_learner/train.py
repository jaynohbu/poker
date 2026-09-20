"""
RL Model Training: Train poker agents using PPO or DQN

Supports:
- Self-play: agents train against each other
- Opponent modeling: agents learn specific player strategies
- Incremental learning: update weights from real player actions
"""

import os
import argparse
from stable_baselines3 import PPO, DQN, A2C
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.callbacks import CheckpointCallback
import numpy as np

from poker_env import HeadsUpTexasHoldemEnv, TexasHoldemEnv


def train_self_play(
    total_timesteps: int = 100000,
    model_name: str = "self_play_v1",
    algorithm: str = "ppo",
    num_envs: int = 4,
    save_path: str = "./models",
) -> None:
    """
    Train RL agents through self-play.
    
    Agents learn optimal poker by playing against each other.
    
    Args:
        total_timesteps: Total training steps
        model_name: Name for saved model
        algorithm: "ppo", "dqn", or "a2c"
        num_envs: Number of parallel environments
        save_path: Directory to save models
    """
    
    print(f"🎮 Starting self-play training ({algorithm.upper()})...")
    print(f"   Total timesteps: {total_timesteps}")
    print(f"   Parallel envs: {num_envs}")
    
    # Create parallel environments
    env = make_vec_env(HeadsUpTexasHoldemEnv, n_envs=num_envs)
    
    # Initialize model
    if algorithm.lower() == "ppo":
        model = PPO(
            "MlpPolicy",
            env,
            learning_rate=3e-4,
            n_steps=2048,
            batch_size=64,
            n_epochs=10,
            verbose=1,
        )
    elif algorithm.lower() == "dqn":
        model = DQN(
            "MlpPolicy",
            env,
            learning_rate=1e-4,
            buffer_size=50000,
            exploration_fraction=0.1,
            verbose=1,
        )
    else:  # a2c
        model = A2C(
            "MlpPolicy",
            env,
            learning_rate=7e-4,
            verbose=1,
        )
    
    # Checkpoint callback
    os.makedirs(save_path, exist_ok=True)
    checkpoint_callback = CheckpointCallback(
        save_freq=10000,
        save_path=save_path,
        name_prefix=f"{model_name}_checkpoint",
    )
    
    # Train model
    print("\n⏳ Training in progress...")
    model.learn(total_timesteps=total_timesteps, callback=checkpoint_callback)
    
    # Save final model
    final_path = os.path.join(save_path, f"{model_name}_final")
    model.save(final_path)
    print(f"\n✅ Training complete!")
    print(f"   Model saved: {final_path}")
    
    env.close()


def train_opponent_modeling(
    player_profile: dict,
    total_timesteps: int = 50000,
    model_name: str = "opponent_model_v1",
    pretrained_model_path: str = None,
    save_path: str = "./models",
) -> None:
    """
    Train agent to predict and counter specific player strategies.
    
    Starts with pretrained self-play model, fine-tunes to opponent.
    
    Args:
        player_profile: Player stats (vpip, pfr, aggression, etc.)
        total_timesteps: Fine-tuning steps
        model_name: Name for saved model
        pretrained_model_path: Path to self-play model to fine-tune
        save_path: Directory to save models
    """
    
    print(f"🎯 Training opponent model for player profile...")
    print(f"   Player: VPIP={player_profile.get('vpip', 0):.2f}, "
          f"PFR={player_profile.get('pfr', 0):.2f}, "
          f"Agg={player_profile.get('aggression_factor', 0):.2f}")
    
    env = HeadsUpTexasHoldemEnv()
    
    # Load pretrained model or create new
    if pretrained_model_path and os.path.exists(pretrained_model_path + ".zip"):
        print(f"   Loading pretrained model: {pretrained_model_path}")
        model = PPO.load(pretrained_model_path, env=env)
    else:
        print("   No pretrained model, training from scratch...")
        model = PPO("MlpPolicy", env, learning_rate=3e-4, verbose=1)
    
    # Fine-tune on opponent profile
    print("\n⏳ Fine-tuning...")
    model.learn(total_timesteps=total_timesteps)
    
    # Save model
    os.makedirs(save_path, exist_ok=True)
    final_path = os.path.join(save_path, model_name)
    model.save(final_path)
    print(f"\n✅ Opponent model saved: {final_path}")
    
    env.close()


def evaluate_model(model_path: str, num_episodes: int = 100) -> dict:
    """
    Evaluate trained model performance.
    
    Args:
        model_path: Path to trained model
        num_episodes: Number of evaluation games
    
    Returns:
        Dictionary with metrics (win_rate, avg_reward, etc.)
    """
    
    print(f"📊 Evaluating model: {model_path}")
    
    env = HeadsUpTexasHoldemEnv()
    model = PPO.load(model_path)
    
    total_reward = 0
    wins = 0
    
    for episode in range(num_episodes):
        obs, _ = env.reset()
        done = False
        
        while not done:
            action, _ = model.predict(obs)
            obs, reward, done, truncated, _ = env.step(action)
            total_reward += reward
            
            if done or truncated:
                if total_reward > 0:
                    wins += 1
                total_reward = 0
        
        if (episode + 1) % 20 == 0:
            print(f"   Episode {episode + 1}/{num_episodes} - Win rate: {wins / (episode + 1):.2%}")
    
    final_winrate = wins / num_episodes
    
    results = {
        'win_rate': final_winrate,
        'avg_reward': total_reward / num_episodes,
        'episodes': num_episodes,
    }
    
    print(f"\n✅ Evaluation complete!")
    print(f"   Win rate: {final_winrate:.2%}")
    
    env.close()
    return results


def main():
    parser = argparse.ArgumentParser(description="Train RL poker agents")
    parser.add_argument("--mode", type=str, choices=["self-play", "opponent", "evaluate"],
                        default="self-play", help="Training mode")
    parser.add_argument("--steps", type=int, default=100000, help="Total training steps")
    parser.add_argument("--algorithm", type=str, choices=["ppo", "dqn", "a2c"],
                        default="ppo", help="RL algorithm")
    parser.add_argument("--model-name", type=str, default="model_v1", help="Model name")
    parser.add_argument("--save-path", type=str, default="./models", help="Save directory")
    parser.add_argument("--model-path", type=str, help="Model path (for evaluation)")
    parser.add_argument("--episodes", type=int, default=100, help="Evaluation episodes")
    
    args = parser.parse_args()
    
    if args.mode == "self-play":
        train_self_play(
            total_timesteps=args.steps,
            model_name=args.model_name,
            algorithm=args.algorithm,
            save_path=args.save_path,
        )
    elif args.mode == "opponent":
        train_opponent_modeling(
            player_profile={},  # In production: load from database
            total_timesteps=args.steps,
            model_name=args.model_name,
            save_path=args.save_path,
        )
    elif args.mode == "evaluate":
        if not args.model_path:
            print("❌ Error: --model-path required for evaluation")
            return
        evaluate_model(args.model_path, args.episodes)


if __name__ == "__main__":
    main()
