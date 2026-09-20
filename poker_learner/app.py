"""
Flask API Server for ML Service

Provides REST endpoints for:
- Model inference (predict next action)
- Player profiling
- Training triggers
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any
import logging

# Import ML modules
from model_inference import predict_action, load_model
from player_profiler import build_player_profile
from feature_extractor import extract_features

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model cache
model_cache = {}


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'service': 'poker-ml-service'}), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict next player action.
    
    Request body:
    {
        "game_state": {...},
        "player_profile": {...},
        "model_name": "self_play_v1"
    }
    
    Response:
    {
        "action": "raise",
        "amount": 50,
        "confidence": 0.87
    }
    """
    try:
        data = request.json
        
        game_state = data.get('game_state')
        player_profile = data.get('player_profile')
        model_name = data.get('model_name', 'self_play_v1')
        
        if not game_state:
            return jsonify({'error': 'game_state required'}), 400
        
        # Predict action
        result = predict_action(
            game_state=game_state,
            player_profile=player_profile,
            model_name=model_name,
            model_cache=model_cache,
        )
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/profile', methods=['POST'])
def get_profile():
    """
    Get or update player profile from game history.
    
    Request body:
    {
        "player_id": 42,
        "game_actions": [...]
    }
    
    Response:
    {
        "player_id": 42,
        "vpip": 0.23,
        "pfr": 0.18,
        "aggression_factor": 1.5,
        ...
    }
    """
    try:
        data = request.json
        
        player_id = data.get('player_id')
        game_actions = data.get('game_actions', [])
        
        if not player_id:
            return jsonify({'error': 'player_id required'}), 400
        
        # Build profile
        profile = build_player_profile(player_id, game_actions)
        
        return jsonify(profile.to_dict()), 200
    
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/features', methods=['POST'])
def extract_game_features():
    """
    Extract ML features from game actions.
    
    Request body:
    {
        "game_id": 123,
        "game_actions": [...]
    }
    
    Response:
    {
        "game_id": 123,
        "actions": [
            {"position": 0, "action_type": "raise", "amount": 50, ...},
            ...
        ]
    }
    """
    try:
        data = request.json
        
        game_id = data.get('game_id')
        game_actions = data.get('game_actions', [])
        
        if not game_id:
            return jsonify({'error': 'game_id required'}), 400
        
        # Extract features
        features = extract_features(game_id, game_actions)
        
        return jsonify(features), 200
    
    except Exception as e:
        logger.error(f"Feature extraction error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/train', methods=['POST'])
def trigger_training():
    """
    Trigger model training/retraining.
    
    Request body:
    {
        "mode": "incremental" or "full",
        "recent_games": 50,
        "model_name": "self_play_v1"
    }
    
    Response:
    {
        "status": "training_started",
        "model_name": "self_play_v1"
    }
    """
    try:
        data = request.json
        
        mode = data.get('mode', 'incremental')
        recent_games = data.get('recent_games', 50)
        model_name = data.get('model_name', 'self_play_v1')
        
        # In production: async task queue (Celery)
        logger.info(f"Training triggered: mode={mode}, games={recent_games}, model={model_name}")
        
        return jsonify({
            'status': 'training_started',
            'mode': mode,
            'model_name': model_name,
        }), 202  # 202 Accepted
    
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/models', methods=['GET'])
def list_models():
    """List available trained models."""
    try:
        models_path = './models'
        
        if not os.path.exists(models_path):
            return jsonify({'models': []}), 200
        
        models = []
        for file in os.listdir(models_path):
            if file.endswith('.zip'):
                models.append(file.replace('.zip', ''))
        
        return jsonify({'models': models}), 200
    
    except Exception as e:
        logger.error(f"Models error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    print(f"\n🚀 Starting Poker ML Service...")
    print(f"   Server: http://localhost:{port}")
    print(f"   Debug: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
