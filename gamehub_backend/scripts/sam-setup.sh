#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v sam >/dev/null 2>&1; then
  echo "ERROR: AWS SAM CLI is not installed."
  echo "Install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
  exit 1
fi

echo "[sam-setup] Building SAM artifacts..."
sam build --template-file template.yaml

echo "[sam-setup] Running guided deploy (creates samconfig.toml)..."
sam deploy --guided --template-file template.yaml

echo "[sam-setup] Done. Use ./scripts/sam-deploy.sh for next deployments."
