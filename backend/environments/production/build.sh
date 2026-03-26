#!/bin/bash
# 로컬에서 production 이미지를 빌드할 때 사용합니다.
# CI에서는 이 스크립트 대신 docker/build-push-action을 사용합니다.
#
# 사용법:
#   DOCKER_IMAGE=myuser/myrepo PORT=8080 ./environments/production/build.sh

set -e

DOCKER_IMAGE="${DOCKER_IMAGE:?DOCKER_IMAGE 환경변수를 설정해주세요 (예: myuser/myrepo:production)}"
PORT="${PORT:-8000}"

echo "Building Docker image: ${DOCKER_IMAGE} (PORT=${PORT})"

docker buildx build \
  --build-arg PORT="${PORT}" \
  --tag "${DOCKER_IMAGE}" \
  --file ./environments/production/Dockerfile \
  --load \
  .

echo "✅ 빌드 완료: ${DOCKER_IMAGE}"
echo "Push하려면: docker push ${DOCKER_IMAGE}"
