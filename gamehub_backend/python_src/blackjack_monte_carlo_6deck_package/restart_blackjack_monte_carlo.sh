#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PYTHON_BIN="${PYTHON_BIN:-$SCRIPT_DIR/../../../.venv/bin/python}"
if [[ ! -x "$PYTHON_BIN" ]]; then
  PYTHON_BIN="${PYTHON_BIN_FALLBACK:-python3}"
fi

KEYS_FILE="${KEYS_FILE:-blackjack_monte_carlo_6deck_keys.csv}"
OUTPUT_FILE="${OUTPUT_FILE:-blackjack_monte_carlo_results_ci_full.csv}"
CHECKPOINT_FILE="${CHECKPOINT_FILE:-$OUTPUT_FILE.checkpoint.csv}"
PROGRESS_FILE="${PROGRESS_FILE:-$OUTPUT_FILE.progress.csv}"
LOG_FILE="${LOG_FILE:-$OUTPUT_FILE.live.log}"

CI_TARGET="${CI_TARGET:-0.005}"
MIN_SIMULATIONS="${MIN_SIMULATIONS:-1000}"
MAX_SIMULATIONS="${MAX_SIMULATIONS:-38416}"
BATCH_SIZE="${BATCH_SIZE:-256}"
SNAPSHOT_EVERY="${SNAPSHOT_EVERY:-50}"
WORKERS="${WORKERS:-$(python3 -c 'import os; print(max(1, (os.cpu_count() or 2) - 1))')}"
SEED="${SEED:-20260926}"

echo "[restart] script_dir=$SCRIPT_DIR"
echo "[restart] python=$PYTHON_BIN"
echo "[restart] output=$OUTPUT_FILE"
echo "[restart] checkpoint=$CHECKPOINT_FILE"
echo "[restart] progress=$PROGRESS_FILE"
echo "[restart] log=$LOG_FILE"

PIDS="$(pgrep -f 'python.*blackjack_monte_carlo.py' || true)"
if [[ -n "$PIDS" ]]; then
  echo "[restart] stopping existing simulation process(es): $PIDS"
  kill $PIDS || true
  sleep 1
  STILL_UP="$(pgrep -f 'python.*blackjack_monte_carlo.py' || true)"
  if [[ -n "$STILL_UP" ]]; then
    echo "[restart] force stopping remaining process(es): $STILL_UP"
    kill -9 $STILL_UP || true
  fi
else
  echo "[restart] no running simulation process found"
fi

echo "[restart] starting simulation in resume mode"
nohup "$PYTHON_BIN" blackjack_monte_carlo.py \
  --keys "$KEYS_FILE" \
  --output "$OUTPUT_FILE" \
  --checkpoint "$CHECKPOINT_FILE" \
  --snapshot-path "$PROGRESS_FILE" \
  --snapshot-every "$SNAPSHOT_EVERY" \
  --resume \
  --ci-target "$CI_TARGET" \
  --min-simulations "$MIN_SIMULATIONS" \
  --max-simulations "$MAX_SIMULATIONS" \
  --batch-size "$BATCH_SIZE" \
  --workers "$WORKERS" \
  --seed "$SEED" \
  > "$LOG_FILE" 2>&1 &

NEW_PID=$!
echo "[restart] started pid=$NEW_PID"
echo "[restart] watch with: tail -f $LOG_FILE"
