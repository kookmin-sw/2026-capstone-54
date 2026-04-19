#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

echo "Starting SQS Celery worker (--profile sqs)..."
dc --profile sqs up -d sqs-celery-worker
