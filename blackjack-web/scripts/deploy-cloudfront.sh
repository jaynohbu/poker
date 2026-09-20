#!/usr/bin/env bash
set -euo pipefail
setopt nonomatch 2>/dev/null || true
APP_NAME="${APP_NAME:-blackjack-web}"
REGION="${AWS_REGION:-$(aws configure get region)}"; REGION="${REGION:-us-west-2}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
BUCKET_NAME="${BUCKET_NAME:-${APP_NAME}-${ACCOUNT_ID}-prod}"
OAC_NAME="${OAC_NAME:-${APP_NAME}-oac}"
DIST_COMMENT="${DIST_COMMENT:-${APP_NAME} production distribution}"
require(){ command -v "$1" >/dev/null || { echo "Missing $1"; exit 1; }; }
require aws; require jq; require npm
npm run build >/dev/null
aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null || aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
aws s3api put-public-access-block --bucket "$BUCKET_NAME" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true >/dev/null
OAC_ID="$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='${OAC_NAME}'].Id | [0]" --output text)"
if [[ "$OAC_ID" == "None" || -z "$OAC_ID" ]]; then
  OAC_ID="$(aws cloudfront create-origin-access-control --origin-access-control-config '{"Name":"'"$OAC_NAME"'","Description":"OAC for static hosting","SigningProtocol":"sigv4","SigningBehavior":"always","OriginAccessControlOriginType":"s3"}' --query 'OriginAccessControl.Id' --output text)"
fi
DIST_ID="$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='${DIST_COMMENT}'].Id | [0]" --output text)"
if [[ "$DIST_ID" == "None" || -z "$DIST_ID" ]]; then
  REF="${APP_NAME}-$(date +%s)"
  cat > /tmp/${APP_NAME}-dist.json <<JSON
{"CallerReference":"$REF","Comment":"$DIST_COMMENT","Enabled":true,"PriceClass":"PriceClass_100","DefaultRootObject":"index.html","Origins":{"Quantity":1,"Items":[{"Id":"${APP_NAME}-s3-origin","DomainName":"${BUCKET_NAME}.s3.${REGION}.amazonaws.com","S3OriginConfig":{"OriginAccessIdentity":""},"OriginAccessControlId":"$OAC_ID"}]},"DefaultCacheBehavior":{"TargetOriginId":"${APP_NAME}-s3-origin","ViewerProtocolPolicy":"redirect-to-https","AllowedMethods":{"Quantity":2,"Items":["GET","HEAD"],"CachedMethods":{"Quantity":2,"Items":["GET","HEAD"]}},"Compress":true,"CachePolicyId":"658327ea-f89d-4fab-a63d-7e88639e58f6"},"CustomErrorResponses":{"Quantity":2,"Items":[{"ErrorCode":403,"ResponsePagePath":"/index.html","ResponseCode":"200","ErrorCachingMinTTL":0},{"ErrorCode":404,"ResponsePagePath":"/index.html","ResponseCode":"200","ErrorCachingMinTTL":0}]},"Restrictions":{"GeoRestriction":{"RestrictionType":"none","Quantity":0}},"ViewerCertificate":{"CloudFrontDefaultCertificate":true}}
JSON
  DIST_ID="$(aws cloudfront create-distribution --distribution-config file:///tmp/${APP_NAME}-dist.json --query 'Distribution.Id' --output text)"
fi
DIST_DOMAIN="$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)"
DIST_ARN="$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.ARN' --output text)"
cat > /tmp/${APP_NAME}-bucket-policy.json <<JSON
{"Version":"2012-10-17","Statement":[{"Sid":"AllowCloudFrontServicePrincipalReadOnly","Effect":"Allow","Principal":{"Service":"cloudfront.amazonaws.com"},"Action":"s3:GetObject","Resource":"arn:aws:s3:::${BUCKET_NAME}/*","Condition":{"StringEquals":{"AWS:SourceArn":"${DIST_ARN}"}}}]}
JSON
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/${APP_NAME}-bucket-policy.json >/dev/null
aws s3 sync dist/blackjack-web/browser "s3://${BUCKET_NAME}" --delete >/dev/null
INV_ID="$(aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths '/*' --query 'Invalidation.Id' --output text)"
echo "Bucket=$BUCKET_NAME"; echo "Distribution=$DIST_ID"; echo "URL=https://$DIST_DOMAIN"; echo "Invalidation=$INV_ID"
