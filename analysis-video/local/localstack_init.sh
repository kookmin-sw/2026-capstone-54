#!/bin/bash
set -e

echo "========================================="
echo "  MeFit analysis-video LocalStack Init"
echo "========================================="

REGION="us-east-1"
ACCOUNT_ID="000000000000"
LAMBDA_ROLE="arn:aws:iam::${ACCOUNT_ID}:role/lambda-role"

VIDEO_BUCKET="pj-kmucd1-04-mefit-video-files"
SCALED_VIDEO_BUCKET="pj-kmucd1-04-mefit-scaled-video-files"
FRAME_BUCKET="pj-kmucd1-04-mefit-video-frame-files"
AUDIO_BUCKET="pj-kmucd1-04-mefit-audio-files"
SCALED_AUDIO_BUCKET="pj-kmucd1-04-mefit-scaled-audio-files"

CORS_CONFIG='{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

echo ""
echo "=== 1. S3 Buckets + CORS ==="
for BUCKET in $VIDEO_BUCKET $SCALED_VIDEO_BUCKET $FRAME_BUCKET $AUDIO_BUCKET $SCALED_AUDIO_BUCKET; do
  awslocal s3 mb "s3://$BUCKET" 2>/dev/null || true
  awslocal s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration "$CORS_CONFIG"
  echo "  [OK] $BUCKET (CORS enabled)"
done

echo ""
echo "=== 2. SNS Topic + SQS Queue ==="
TOPIC_ARN=$(awslocal sns create-topic --name mefit-video-processing-complete --query 'TopicArn' --output text)
echo "  [OK] SNS Topic: $TOPIC_ARN"

QUEUE_URL=$(awslocal sqs create-queue --queue-name mefit-video-processing-queue --query 'QueueUrl' --output text)
QUEUE_ARN=$(awslocal sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
awslocal sns subscribe --topic-arn "$TOPIC_ARN" --protocol sqs --notification-endpoint "$QUEUE_ARN" > /dev/null
echo "  [OK] SQS Queue: $QUEUE_URL (subscribed to SNS)"

echo ""
echo "=== 3. Install ffmpeg (static build for Lambda) ==="
FFMPEG_DIR="/tmp/mefit-ffmpeg"
if [ ! -f "$FFMPEG_DIR/ffmpeg" ] || ! "$FFMPEG_DIR/ffmpeg" -version > /dev/null 2>&1; then
  mkdir -p "$FFMPEG_DIR"
  echo "  Downloading static ffmpeg..."
  curl -sL "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o /tmp/ffmpeg-static.tar.xz
  tar xf /tmp/ffmpeg-static.tar.xz -C /tmp/ --wildcards '*/ffmpeg' --strip-components=1
  mv /tmp/ffmpeg "$FFMPEG_DIR/ffmpeg"
  chmod +x "$FFMPEG_DIR/ffmpeg"
  rm -f /tmp/ffmpeg-static.tar.xz
  echo "  [OK] ffmpeg static build: $($FFMPEG_DIR/ffmpeg -version 2>&1 | head -1)"
else
  echo "  [OK] ffmpeg already present: $($FFMPEG_DIR/ffmpeg -version 2>&1 | head -1)"
fi

echo ""
echo "=== 4. Lambda Functions (Layer code + ffmpeg bundled) ==="

FUNCTIONS_DIR="/opt/mefit/functions"
LAYERS_DIR="/opt/mefit/layers/common/python"
OUT_DIR="/tmp/lambda-packages"
mkdir -p "$OUT_DIR"

LAMBDA_ENV="Variables={VIDEO_BUCKET=$VIDEO_BUCKET,SCALED_VIDEO_BUCKET=$SCALED_VIDEO_BUCKET,FRAME_BUCKET=$FRAME_BUCKET,AUDIO_BUCKET=$AUDIO_BUCKET,SCALED_AUDIO_BUCKET=$SCALED_AUDIO_BUCKET,SNS_TOPIC_ARN=$TOPIC_ARN,REGION=$REGION,FFMPEG_PATH=/opt/ffmpeg-bin/ffmpeg}"

FUNCTIONS="video_converter frame_extractor audio_extractor audio_scaler processing_notifier"

for FUNC in $FUNCTIONS; do
  TMPDIR=$(mktemp -d)
  cp "$FUNCTIONS_DIR/$FUNC/handler.py" "$TMPDIR/"
  cp -r "$LAYERS_DIR/mefit_video_common" "$TMPDIR/"
  (cd "$TMPDIR" && zip -qr "$OUT_DIR/$FUNC.zip" .)
  rm -rf "$TMPDIR"

  FUNC_DASH=$(echo "$FUNC" | tr '_' '-')

  awslocal lambda delete-function --function-name "mefit-${FUNC_DASH}" 2>/dev/null || true

  awslocal lambda create-function \
    --function-name "mefit-${FUNC_DASH}" \
    --runtime python3.12 \
    --handler handler.handler \
    --zip-file "fileb://${OUT_DIR}/${FUNC}.zip" \
    --role "$LAMBDA_ROLE" \
    --timeout 300 \
    --memory-size 512 \
    --environment "$LAMBDA_ENV" \
    > /dev/null

  echo "  [..] Lambda: mefit-${FUNC_DASH} (waiting for Active...)"
  awslocal lambda wait function-active-v2 --function-name "mefit-${FUNC_DASH}" 2>/dev/null || sleep 5
  echo "  [OK] Lambda: mefit-${FUNC_DASH}"
done

echo ""
echo "=== 5. S3 Event Notifications → Lambda ==="

add_s3_trigger() {
  local BUCKET=$1
  local FUNC_DASH=$2

  awslocal lambda add-permission \
    --function-name "$FUNC_DASH" \
    --statement-id "s3-trigger-${BUCKET}-${FUNC_DASH}" \
    --action lambda:InvokeFunction \
    --principal s3.amazonaws.com \
    --source-arn "arn:aws:s3:::${BUCKET}" \
    2>/dev/null || true
}

awslocal s3api put-bucket-notification-configuration \
  --bucket "$VIDEO_BUCKET" \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "LambdaFunctionArn": "arn:aws:lambda:'"$REGION"':'"$ACCOUNT_ID"':function:mefit-video-converter",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {"Key": {"FilterRules": [{"Name": "suffix", "Value": ".webm"}]}}
      },
      {
        "LambdaFunctionArn": "arn:aws:lambda:'"$REGION"':'"$ACCOUNT_ID"':function:mefit-frame-extractor",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {"Key": {"FilterRules": [{"Name": "suffix", "Value": ".webm"}]}}
      },
      {
        "LambdaFunctionArn": "arn:aws:lambda:'"$REGION"':'"$ACCOUNT_ID"':function:mefit-audio-extractor",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {"Key": {"FilterRules": [{"Name": "suffix", "Value": ".webm"}]}}
      }
    ]
  }'
echo "  [OK] $VIDEO_BUCKET → video-converter, frame-extractor, audio-extractor"

add_s3_trigger "$VIDEO_BUCKET" "mefit-video-converter"
add_s3_trigger "$VIDEO_BUCKET" "mefit-frame-extractor"
add_s3_trigger "$VIDEO_BUCKET" "mefit-audio-extractor"

awslocal s3api put-bucket-notification-configuration \
  --bucket "$AUDIO_BUCKET" \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "LambdaFunctionArn": "arn:aws:lambda:'"$REGION"':'"$ACCOUNT_ID"':function:mefit-audio-scaler",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {"Key": {"FilterRules": [{"Name": "suffix", "Value": ".wav"}]}}
      }
    ]
  }'
echo "  [OK] $AUDIO_BUCKET → audio-scaler"
add_s3_trigger "$AUDIO_BUCKET" "mefit-audio-scaler"

awslocal s3api put-bucket-notification-configuration \
  --bucket "$SCALED_VIDEO_BUCKET" \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "LambdaFunctionArn": "arn:aws:lambda:'"$REGION"':'"$ACCOUNT_ID"':function:mefit-processing-notifier",
        "Events": ["s3:ObjectCreated:*"]
      }
    ]
  }'
add_s3_trigger "$SCALED_VIDEO_BUCKET" "mefit-processing-notifier"
echo "  [OK] $SCALED_VIDEO_BUCKET → processing-notifier"

echo ""
echo "========================================="
echo "  Init complete!"
echo ""
echo "  S3 Buckets:     5 (CORS enabled)"
echo "  Lambda:         5 (layer code + ffmpeg bundled)"
echo "  S3 Triggers:    5"
echo "  SNS → SQS:      1"
echo ""
echo "  Endpoint: http://localhost:4566"
echo "========================================="
