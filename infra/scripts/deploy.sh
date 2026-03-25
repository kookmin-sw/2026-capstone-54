#!/usr/bin/env bash
#
# k3s production 배포 / 롤백 스크립트
#
# 사용법:
#   ./deploy.sh <이미지태그> [타겟]              # 배포
#   ./deploy.sh rollback [타겟] [리비전]         # 롤백
#   ./deploy.sh status [타겟]                   # 상태 확인
#   ./deploy.sh history [타겟]                  # 배포 이력 조회
#
# 배포 예시:
#   ./deploy.sh production                      # 전체 배포 (production 태그)
#   ./deploy.sh 59b5ccc api                     # API만 특정 커밋 해시로 배포
#
# 롤백 예시:
#   ./deploy.sh rollback                        # 전체 직전 버전으로 롤백
#   ./deploy.sh rollback api                    # API만 롤백
#   ./deploy.sh rollback celery-worker 3        # celery-worker를 리비전 3으로 롤백
#

set -euo pipefail

NAMESPACE="mefit-backend-production"
IMAGE_REPO="teammefit/mefit-backend"
ALL_DEPLOYMENTS=(
  "mefit-production-api"
  "mefit-production-celery-worker"
  "mefit-production-celery-beat"
)

COMMAND="${1:?사용법: $0 <이미지태그|rollback|status|history> [타겟] [리비전]}"

# ─── rollback / status / history 서브커맨드 ───
if [[ "$COMMAND" == "rollback" || "$COMMAND" == "status" || "$COMMAND" == "history" ]]; then
  TARGET="${2:-all}"
  REVISION="${3:-}"

  resolve_deployments() {
    if [[ "$TARGET" == "all" ]]; then
      echo "${ALL_DEPLOYMENTS[@]}"
    else
      echo "mefit-production-${TARGET}"
    fi
  }

  case "$COMMAND" in
    rollback)
      echo "══════════════════════════════════════════"
      echo "  🔄 롤백: production / ${TARGET}"
      [[ -n "$REVISION" ]] && echo "  리비전: ${REVISION}"
      echo "══════════════════════════════════════════"
      for deploy in $(resolve_deployments); do
        echo "▶ ${deploy} 롤백 중..."
        if [[ -n "$REVISION" ]]; then
          kubectl rollout undo "deployment/${deploy}" -n "${NAMESPACE}" --to-revision="${REVISION}"
        else
          kubectl rollout undo "deployment/${deploy}" -n "${NAMESPACE}"
        fi
        kubectl rollout status "deployment/${deploy}" -n "${NAMESPACE}" --timeout=300s
      done
      echo "✅ 롤백 완료"
      kubectl get pods -n "${NAMESPACE}"
      ;;

    status)
      echo "── Deployments ──"
      for deploy in $(resolve_deployments); do
        kubectl rollout status "deployment/${deploy}" -n "${NAMESPACE}" 2>/dev/null || true
      done
      echo ""
      echo "── Pods ──"
      kubectl get pods -n "${NAMESPACE}" -o wide
      ;;

    history)
      for deploy in $(resolve_deployments); do
        echo "── ${deploy} ──"
        kubectl rollout history "deployment/${deploy}" -n "${NAMESPACE}"
      done
      ;;
  esac

  exit 0
fi

# ─── 배포 모드 ───
IMAGE_TAG="$COMMAND"
TARGET="${2:-all}"

VALID_TARGETS=("all" "api" "celery-worker" "celery-beat")
if [[ ! " ${VALID_TARGETS[*]} " =~ " ${TARGET} " ]]; then
  echo "❌ 유효하지 않은 타겟: $TARGET (사용 가능: ${VALID_TARGETS[*]})"
  exit 1
fi

echo "══════════════════════════════════════════"
echo "  🚀 배포: production"
echo "  이미지:  ${IMAGE_REPO}:${IMAGE_TAG}"
echo "  타겟:    ${TARGET}"
echo "══════════════════════════════════════════"

deploy_target() {
  local deploy_name="mefit-production-${1}"
  local container_name

  case "$1" in
    api)            container_name="django" ;;
    celery-worker)  container_name="celery-worker" ;;
    celery-beat)    container_name="celery-beat" ;;
  esac

  echo "▶ ${deploy_name} 이미지 업데이트 중..."
  kubectl set image "deployment/${deploy_name}" \
    "${container_name}=${IMAGE_REPO}:${IMAGE_TAG}" \
    -n "${NAMESPACE}"

  echo "▶ rollout 대기 중..."
  kubectl rollout status "deployment/${deploy_name}" -n "${NAMESPACE}" --timeout=300s
}

if [[ "$TARGET" == "all" ]]; then
  echo "▶ 매니페스트 적용 중..."
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  kubectl apply -f "${SCRIPT_DIR}/../"

  echo "▶ 이미지 업데이트 중..."
  for deploy in "${ALL_DEPLOYMENTS[@]}"; do
    kubectl set image "deployment/${deploy}" "*=${IMAGE_REPO}:${IMAGE_TAG}" -n "${NAMESPACE}" 2>/dev/null || true
  done

  echo "▶ rollout 대기 중..."
  for deploy in "${ALL_DEPLOYMENTS[@]}"; do
    kubectl rollout status "deployment/${deploy}" -n "${NAMESPACE}" --timeout=300s
  done
else
  deploy_target "$TARGET"
fi

echo ""
echo "✅ 배포 완료: ${IMAGE_TAG}"
echo ""
kubectl get pods -n "${NAMESPACE}"
