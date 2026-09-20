#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v sam >/dev/null 2>&1; then
  echo "ERROR: AWS SAM CLI is not installed."
  exit 1
fi

if [[ ! -f samconfig.toml ]]; then
  echo "ERROR: samconfig.toml not found. Run ./scripts/sam-setup.sh first."
  exit 1
fi

echo "[sam-deploy] Building SAM artifacts..."
sam build --template-file template.yaml

echo "[sam-deploy] Deploying stack from samconfig.toml..."
sam deploy --template-file template.yaml

echo "[sam-deploy] Deployment completed."
