#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REGION="${AWS_REGION:-us-west-2}"
STACK_NAME="${STACK_NAME:-gamehub-service}"
FUNCTION_NAME="${FUNCTION_NAME:-}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: Missing required command: $1"
    exit 1
  }
}

require aws
require npm
require zip

if [[ -z "$FUNCTION_NAME" ]]; then
  FUNCTION_NAME="$(aws cloudformation describe-stack-resources \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "StackResources[?ResourceType=='AWS::Lambda::Function'].PhysicalResourceId" \
    --output text)"
fi

if [[ -z "$FUNCTION_NAME" || "$FUNCTION_NAME" == "None" ]]; then
  echo "ERROR: Could not resolve Lambda function name."
  echo "Hint: set FUNCTION_NAME explicitly."
  exit 1
fi

echo "[lambda:deploy-code] Building NestJS app..."
npm run build >/dev/null

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cp -R dist package.json package-lock.json "$TMP_DIR"/
npm ci --omit=dev --prefix "$TMP_DIR" >/dev/null

ZIP_PATH="$TMP_DIR/function.zip"
(
  cd "$TMP_DIR"
  zip -rq "$ZIP_PATH" dist package.json package-lock.json node_modules
)

echo "[lambda:deploy-code] Updating Lambda code: $FUNCTION_NAME"
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$ZIP_PATH" \
  --region "$REGION" \
  --output text >/dev/null

aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"

echo "[lambda:deploy-code] Done."
aws lambda get-function \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --query 'Configuration.{FunctionName:FunctionName,LastModified:LastModified,Version:Version}' \
  --output table
