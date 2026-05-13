#!/bin/bash
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
ENDPOINT="http://localhost:4566"

echo "========================================="
echo "  MeFit S3 Browser (LocalStack)"
echo "========================================="
echo ""

BUCKETS=(
  "pj-kmucd1-04-mefit-video-files"
  "pj-kmucd1-04-mefit-scaled-video-files"
  "pj-kmucd1-04-mefit-video-frame-files"
  "pj-kmucd1-04-mefit-audio-files"
  "pj-kmucd1-04-mefit-scaled-audio-files"
)

for BUCKET in "${BUCKETS[@]}"; do
  COUNT=$(aws --endpoint-url="$ENDPOINT" s3api list-objects-v2 --bucket "$BUCKET" --query 'Contents | length(@)' --output text 2>/dev/null || echo "0")
  if [ "$COUNT" = "None" ] || [ "$COUNT" = "0" ] || [ -z "$COUNT" ]; then
    echo "  $BUCKET: (empty)"
  else
    echo "  $BUCKET: $COUNT file(s)"
    aws --endpoint-url="$ENDPOINT" s3api list-objects-v2 --bucket "$BUCKET" \
      --query 'Contents[].{Key:Key,Size:Size,Modified:LastModified}' --output table 2>/dev/null
  fi
  echo ""
done
