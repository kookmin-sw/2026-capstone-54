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
docker build \
  -t "${IMAGE}:${TAG}" \
  -f "${SCRIPT_DIR}/Dockerfile.postgres" \
  "${SCRIPT_DIR}"

if [ "$TAG" != "latest" ]; then
  docker tag "${IMAGE}:${TAG}" "${IMAGE}:latest"
fi

echo "==> Pushing ${IMAGE}:${TAG} ..."
docker push "${IMAGE}:${TAG}"

if [ "$TAG" != "latest" ]; then
  echo "==> Pushing ${IMAGE}:latest ..."
  docker push "${IMAGE}:latest"
fi

echo "==> Done! Image pushed: ${IMAGE}:${TAG}"
