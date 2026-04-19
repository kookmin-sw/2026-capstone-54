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
echo "=== 2. SNS Topics + SQS Queues ==="

STEP_COMPLETE_QUEUE_URL=$(awslocal sqs create-queue --queue-name mefit-video-step-complete --query 'QueueUrl' --output text)
echo "  [OK] SQS Queue (step-complete): $STEP_COMPLETE_QUEUE_URL"

UPLOAD_SNS_ARN=$(awslocal sns create-topic --name mefit-video-uploaded --query 'TopicArn' --output text)
echo "  [OK] SNS Topic (video-uploaded fan-out): $UPLOAD_SNS_ARN"

create_fanout_queue() {
  local QUEUE_NAME=$1
  local SNS_ARN=$2
  local Q_URL
  local Q_ARN

  Q_URL=$(awslocal sqs create-queue --queue-name "$QUEUE_NAME" --query 'QueueUrl' --output text)
  Q_ARN=$(awslocal sqs get-queue-attributes --queue-url "$Q_URL" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
  awslocal sqs set-queue-attributes --queue-url "$Q_URL" --attributes '{
    "Policy": "{\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"sqs:SendMessage\",\"Resource\":\"*\"}]}"
  }'
  awslocal sns subscribe --topic-arn "$SNS_ARN" --protocol sqs --notification-endpoint "$Q_ARN" > /dev/null
  echo "  [OK] SQS: $QUEUE_NAME → SNS subscribed"
  echo "$Q_ARN"
}

VC_QUEUE_ARN=$(create_fanout_queue "mefit-video-converter-queue" "$UPLOAD_SNS_ARN")
FE_QUEUE_ARN=$(create_fanout_queue "mefit-frame-extractor-queue" "$UPLOAD_SNS_ARN")
AE_QUEUE_ARN=$(create_fanout_queue "mefit-audio-extractor-queue" "$UPLOAD_SNS_ARN")

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

LAMBDA_ENV="Variables={VIDEO_BUCKET=$VIDEO_BUCKET,SCALED_VIDEO_BUCKET=$SCALED_VIDEO_BUCKET,FRAME_BUCKET=$FRAME_BUCKET,AUDIO_BUCKET=$AUDIO_BUCKET,SCALED_AUDIO_BUCKET=$SCALED_AUDIO_BUCKET,STEP_COMPLETE_SQS_URL=$STEP_COMPLETE_QUEUE_URL,REGION=$REGION,FFMPEG_PATH=/opt/ffmpeg-bin/ffmpeg}"

FUNCTIONS="video_converter frame_extractor audio_extractor"

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
echo "=== 4b. voice-analyzer Lambda (on-demand, with pydub) ==="
AUDIO_LAYERS_DIR="/opt/mefit/layers/audio-analysis"
VA_TMPDIR=$(mktemp -d)
cp "$FUNCTIONS_DIR/voice_analyzer/handler.py" "$VA_TMPDIR/"
cp -r "$LAYERS_DIR/mefit_video_common" "$VA_TMPDIR/"
pip install -q pydub numpy -t "$VA_TMPDIR/" --platform manylinux2014_x86_64 --python-version 3.12 --only-binary=:all: --implementation cp 2>/dev/null
(cd "$VA_TMPDIR" && zip -qr "$OUT_DIR/voice_analyzer.zip" .)
rm -rf "$VA_TMPDIR"

VA_ENV="Variables={REGION=$REGION,SILENCE_THRESH_DBFS=-40,MIN_SILENCE_LEN_MS=500,SEEK_STEP_MS=10,FFMPEG_PATH=/opt/ffmpeg-bin/ffmpeg,PYDUB_FFMPEG=/opt/ffmpeg-bin/ffmpeg,PYDUB_FFPROBE=/opt/ffmpeg-bin/ffprobe,S3_ENDPOINT_URL=http://host.docker.internal:4566}"

awslocal lambda delete-function --function-name "pj-kmucd1-04-mefit-voice-analyzer" 2>/dev/null || true
awslocal lambda create-function \
  --function-name "pj-kmucd1-04-mefit-voice-analyzer" \
  --runtime python3.12 \
  --handler handler.handler \
  --zip-file "fileb://${OUT_DIR}/voice_analyzer.zip" \
  --role "$LAMBDA_ROLE" \
  --timeout 120 \
  --memory-size 1024 \
  --environment "$VA_ENV" \
  > /dev/null

echo "  [..] Lambda: pj-kmucd1-04-mefit-voice-analyzer (waiting for Active...)"
awslocal lambda wait function-active-v2 --function-name "pj-kmucd1-04-mefit-voice-analyzer" 2>/dev/null || sleep 5
echo "  [OK] Lambda: pj-kmucd1-04-mefit-voice-analyzer"

echo ""
echo "=== 5. S3 → SNS Event Notification ==="

awslocal s3api put-bucket-notification-configuration \
  --bucket "$VIDEO_BUCKET" \
  --notification-configuration '{
    "TopicConfigurations": [
      {
        "TopicArn": "'"$UPLOAD_SNS_ARN"'",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {"Key": {"FilterRules": [{"Name": "suffix", "Value": ".webm"}]}}
      }
    ]
  }'
echo "  [OK] $VIDEO_BUCKET (.webm) → SNS: video-uploaded"

add_s3_lambda_trigger() {
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





echo ""
echo "=== 6. SQS → Lambda Event Source Mappings (fan-out) ==="

for PAIR in \
  "mefit-video-converter:$VC_QUEUE_ARN" \
  "mefit-frame-extractor:$FE_QUEUE_ARN" \
  "mefit-audio-extractor:$AE_QUEUE_ARN"; do

  FUNC_NAME="${PAIR%%:*}"
  QUEUE_ARN="${PAIR##*:}"

  awslocal lambda create-event-source-mapping \
    --function-name "$FUNC_NAME" \
    --event-source-arn "$QUEUE_ARN" \
    --batch-size 1 \
    --enabled \
    > /dev/null 2>&1 || true
  echo "  [OK] SQS → Lambda: $FUNC_NAME"
done

echo ""
echo "========================================="
echo "  Init complete!"
echo ""
echo "  S3 Buckets:        5 (CORS enabled)"
echo "  Lambda:            4 (3 pipeline + 1 voice-analyzer)"
echo "  SNS Topics:        1 (video-uploaded)"
echo "  SQS Queues:        4 (3 fan-out + step-complete)"
echo "  Event Sources:     3 (SQS→Lambda fan-out)"
echo ""
echo "  Flow: S3 .webm → SNS → 3×SQS → 3×Lambda"
echo "  Endpoint: http://localhost:4566"
echo "  Step-Complete SQS: $STEP_COMPLETE_QUEUE_URL"
echo "========================================="
