#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-us-west-2}"
PREFIX="${APP_PREFIX:-blackjack-web}"
CALLBACK_URL="${CALLBACK_URL:-http://localhost:4200/auth/login}"
LOGOUT_URL="${LOGOUT_URL:-http://localhost:4200/}"
SOCIAL_PROVIDERS="${SOCIAL_PROVIDERS:-COGNITO}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
POOL_NAME="${PREFIX}-users"
CLIENT_NAME="${PREFIX}-web-client"
IDENTITY_NAME="${PREFIX}-identity-pool"
BUCKET_NAME="${PREFIX}-avatars-${ACCOUNT_ID}"
ROLE_NAME="${PREFIX}-cognito-auth-role"

aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null || aws s3api create-bucket \
  --bucket "$BUCKET_NAME" --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION" >/dev/null

POOL_ID="$(aws cognito-idp create-user-pool --region "$REGION" --pool-name "$POOL_NAME" \
  --username-attributes email --auto-verified-attributes email \
  --schema 'Name=nickname,AttributeDataType=String,Mutable=true,StringAttributeConstraints={MinLength=2,MaxLength=20}' \
  'Name=avatar,AttributeDataType=String,Mutable=true,StringAttributeConstraints={MinLength=1,MaxLength=2048}' \
  --query 'UserPool.Id' --output text)"

CLIENT_ID="$(aws cognito-idp create-user-pool-client --region "$REGION" --user-pool-id "$POOL_ID" \
  --client-name "$CLIENT_NAME" --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --supported-identity-providers $SOCIAL_PROVIDERS --allowed-o-auth-flows-user-pool-client \
  --allowed-o-auth-flows code --allowed-o-auth-scopes email openid profile \
  --callback-urls "$CALLBACK_URL" --logout-urls "$LOGOUT_URL" \
  --query 'UserPoolClient.ClientId' --output text)"

IDENTITY_POOL_ID="$(aws cognito-identity create-identity-pool --region "$REGION" --identity-pool-name "$IDENTITY_NAME" \
  --no-allow-unauthenticated-identities \
  --cognito-identity-providers ProviderName="cognito-idp.${REGION}.amazonaws.com/${POOL_ID}",ClientId="$CLIENT_ID" \
  --query 'IdentityPoolId' --output text)"

cat > /tmp/${PREFIX}-trust.json <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"cognito-identity.amazonaws.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"cognito-identity.amazonaws.com:aud":"${IDENTITY_POOL_ID}"},"ForAnyValue:StringLike":{"cognito-identity.amazonaws.com:amr":"authenticated"}}}]}
EOF

aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1 || aws iam create-role \
  --role-name "$ROLE_NAME" --assume-role-policy-document file:///tmp/${PREFIX}-trust.json >/dev/null

cat > /tmp/${PREFIX}-policy.json <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:GetObject","s3:PutObject"],"Resource":"arn:aws:s3:::${BUCKET_NAME}/avatars/*"}]}
EOF

aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "${PREFIX}-avatar-policy" \
  --policy-document file:///tmp/${PREFIX}-policy.json >/dev/null
ROLE_ARN="$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)"
aws cognito-identity set-identity-pool-roles --region "$REGION" --identity-pool-id "$IDENTITY_POOL_ID" \
  --roles authenticated="$ROLE_ARN" >/dev/null

CONFIG_FILE="src/app/core/config/cognito.config.ts"
sed -i '' "s/region: '.*'/region: '${REGION}'/" "$CONFIG_FILE"
sed -i '' "s/userPoolId: '.*'/userPoolId: '${POOL_ID}'/" "$CONFIG_FILE"
sed -i '' "s/userPoolClientId: '.*'/userPoolClientId: '${CLIENT_ID}'/" "$CONFIG_FILE"
sed -i '' "s/identityPoolId: '.*'/identityPoolId: '${IDENTITY_POOL_ID}'/" "$CONFIG_FILE"
sed -i '' "s/bucket: '.*'/bucket: '${BUCKET_NAME}'/" "$CONFIG_FILE"
sed -i '' "s/region: 'us-west-2'/region: '${REGION}'/2" "$CONFIG_FILE"

echo "UserPoolId=$POOL_ID"
echo "UserPoolClientId=$CLIENT_ID"
echo "IdentityPoolId=$IDENTITY_POOL_ID"
echo "AvatarBucket=$BUCKET_NAME"
