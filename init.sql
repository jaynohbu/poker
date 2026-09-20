-- Poker Platform Database Schema
-- MySQL 8.0+

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  balance DECIMAL(10, 2) DEFAULT 1000.00,
  status ENUM('online', 'offline', 'in_game') DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_oauth (oauth_provider, oauth_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Games table
CREATE TABLE IF NOT EXISTS games (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id VARCHAR(255) NOT NULL,
  game_type ENUM('cash', 'tournament', 'training') DEFAULT 'cash',
  status ENUM('waiting', 'active', 'completed', 'cancelled') DEFAULT 'waiting',
  small_blind DECIMAL(10, 2) NOT NULL,
  big_blind DECIMAL(10, 2) NOT NULL,
  pot DECIMAL(15, 2) DEFAULT 0.00,
  total_players INT DEFAULT 0,
  active_players INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room (room_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Game Actions table (for ML learning)
CREATE TABLE IF NOT EXISTS game_actions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  game_id BIGINT NOT NULL,
  player_id BIGINT NOT NULL,
  action_type ENUM('fold', 'check', 'call', 'raise', 'all_in', 'post_blind') NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0.00,
  street ENUM('preflop', 'flop', 'turn', 'river') NOT NULL,
  position INT,
  hole_cards VARCHAR(10),
  community_cards VARCHAR(20),
  pot_size DECIMAL(15, 2),
  stack_size DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_game (game_id),
  INDEX idx_player (player_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Player Profiles table (ML features)
CREATE TABLE IF NOT EXISTS player_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNIQUE NOT NULL,
  vpip DECIMAL(5, 2),
  pfr DECIMAL(5, 2),
  aggression_factor DECIMAL(5, 2),
  fold_to_aggression DECIMAL(5, 2),
  fold_to_3bet DECIMAL(5, 2),
  cbet_frequency DECIMAL(5, 2),
  won_at_showdown DECIMAL(5, 2),
  fold_at_showdown DECIMAL(5, 2),
  position_stats JSON,
  tilt_indicator DECIMAL(3, 2),
  total_hands INT DEFAULT 0,
  winning_hands INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ML Models table
CREATE TABLE IF NOT EXISTS ml_models (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  model_type ENUM('self_play', 'opponent_model', 'heuristic') DEFAULT 'self_play',
  version VARCHAR(50),
  file_path VARCHAR(500),
  algorithm VARCHAR(100),
  training_steps INT,
  win_rate DECIMAL(5, 2),
  training_data_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  INDEX idx_name (name),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Hand Records table
CREATE TABLE IF NOT EXISTS hand_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  game_id BIGINT NOT NULL,
  hand_number INT,
  hero_id BIGINT,
  opponent_id BIGINT,
  hero_cards VARCHAR(10),
  opponent_cards VARCHAR(10),
  community_cards VARCHAR(20),
  winner_id BIGINT,
  pot_size DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (hero_id) REFERENCES users(id),
  FOREIGN KEY (opponent_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id),
  INDEX idx_game (game_id),
  INDEX idx_hero (hero_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
  start_time TIMESTAMP NULL,
  end_time TIMESTAMP NULL,
  entry_fee DECIMAL(10, 2),
  prize_pool DECIMAL(15, 2),
  max_players INT,
  current_players INT DEFAULT 0,
  buy_in DECIMAL(10, 2),
  starting_chips INT,
  blind_structure JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_start (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Tournament Entries table
CREATE TABLE IF NOT EXISTS tournament_entries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tournament_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  buy_in_amount DECIMAL(10, 2),
  current_stack INT,
  position INT,
  status ENUM('active', 'eliminated', 'withdrew') DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_entry (tournament_id, user_id),
  INDEX idx_tournament (tournament_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.username,
  u.display_name,
  u.avatar_url,
  COUNT(DISTINCT hr.id) as games_played,
  COUNT(CASE WHEN hr.winner_id = u.id THEN 1 END) as games_won,
  ROUND(COUNT(CASE WHEN hr.winner_id = u.id THEN 1 END) / COUNT(DISTINCT hr.id) * 100, 2) as win_rate,
  SUM(hr.pot_size) as total_pot_played,
  pp.vpip,
  pp.pfr,
  pp.aggression_factor
FROM users u
LEFT JOIN hand_records hr ON u.id = hr.hero_id OR u.id = hr.opponent_id
LEFT JOIN player_profiles pp ON u.id = pp.user_id
GROUP BY u.id, u.username, u.display_name, u.avatar_url, pp.vpip, pp.pfr, pp.aggression_factor
ORDER BY games_won DESC, win_rate DESC;
