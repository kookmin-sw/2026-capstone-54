#!/usr/bin/env bash
#
# mefit-postgres-dev 이미지를 빌드하여 Docker Hub에 push 합니다.
#
# 사용법:
#   bash environments/development/push-postgres-image.sh          # latest
#   bash environments/development/push-postgres-image.sh 1.0.0    # 특정 태그
#
# 사전 조건:
#   docker login  (Docker Hub 인증이 되어 있어야 합니다)
#
set -euo pipefail

IMAGE="teammefit/mefit-postgres-dev"
TAG="${1:-latest}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Building ${IMAGE}:${TAG} ..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "${IMAGE}:${TAG}" \
  -f "${SCRIPT_DIR}/Dockerfile.postgres" \
  --push \
  "${SCRIPT_DIR}"

if [ "$TAG" != "latest" ]; then
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t "${IMAGE}:latest" \
    -f "${SCRIPT_DIR}/Dockerfile.postgres" \
    --push \
    "${SCRIPT_DIR}"
fi

echo "==> Done! Image pushed: ${IMAGE}:${TAG}"
