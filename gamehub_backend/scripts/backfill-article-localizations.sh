#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-us-west-2}"
TABLE_NAME="${ARTICLES_TABLE_NAME:-gh_articles_prod}"
API_BASE_URL="${API_BASE_URL:-https://bxqrvz8qe9.execute-api.us-west-2.amazonaws.com/prod/api}"
LANGUAGES="${LANGUAGES:-en ja}"

command -v aws >/dev/null 2>&1 || { echo "ERROR: aws CLI is required"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl is required"; exit 1; }

slugs=()
while IFS= read -r slug; do
  [[ -n "$slug" ]] && slugs+=("$slug")
done < <(
  aws dynamodb scan \
    --region "$REGION" \
    --table-name "$TABLE_NAME" \
    --projection-expression slug \
    --query 'Items[].slug.S' \
    --output text | tr '\t' '\n' | sed '/^$/d'
)

echo "[backfill] table=$TABLE_NAME region=$REGION articles=${#slugs[@]} languages=$LANGUAGES"

for slug in "${slugs[@]}"; do
  for language in $LANGUAGES; do
    status="$({ curl -sS -o /tmp/article-backfill-response.json -w '%{http_code}' "$API_BASE_URL/articles/$slug?language=$language"; } || true)"
    echo "[backfill] slug=$slug language=$language status=$status"
    if [[ "$status" != "200" ]]; then
      cat /tmp/article-backfill-response.json
      exit 1
    fi
  done
done

echo "[backfill] completed"