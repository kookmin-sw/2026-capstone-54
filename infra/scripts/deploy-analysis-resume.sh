#!/usr/bin/env bash
#
# analysis-resume Celery Worker k3s production 배포 스크립트
#
# 사용법:
#   ./deploy-analysis-resume.sh <이미지태그>           # 배포
#   ./deploy-analysis-resume.sh rollback [리비전]      # 롤백
#   ./deploy-analysis-resume.sh status                 # 상태 확인
#   ./deploy-analysis-resume.sh history                # 배포 이력 조회
#

set -euo pipefail

NAMESPACE="mefit-backend-production"
IMAGE_REPO="teammefit/mefit-analysis-resume"
DEPLOYMENT="mefit-production-analysis-resume-worker"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/.."

COMMAND="${1:?사용법: $0 <이미지태그|rollback|status|history> [리비전]}"

# ─── rollback / status / history 서브커맨드 ───
if [[ "$COMMAND" == "rollback" || "$COMMAND" == "status" || "$COMMAND" == "history" ]]; then
  REVISION="${2:-}"

  case "$COMMAND" in
    rollback)
      echo "══════════════════════════════════════════"
      echo "  🔄 analysis-resume Worker 롤백"
      [[ -n "$REVISION" ]] && echo "  리비전: ${REVISION}"
      echo "══════════════════════════════════════════"
      if [[ -n "$REVISION" ]]; then
        kubectl rollout undo "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" --to-revision="${REVISION}"
      else
        kubectl rollout undo "deployment/${DEPLOYMENT}" -n "${NAMESPACE}"
      fi
      kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=300s
      echo "✅ 롤백 완료"
      kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT}"
      ;;

    status)
      echo "── analysis-resume Worker Deployment ──"
      kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" 2>/dev/null || true
      echo ""
      echo "── Pods ──"
      kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT}" -o wide
      ;;

    history)
      echo "── ${DEPLOYMENT} ──"
      kubectl rollout history "deployment/${DEPLOYMENT}" -n "${NAMESPACE}"
      ;;
  esac

  exit 0
fi

# ─── 배포 모드 ───
IMAGE_TAG="$COMMAND"

echo "══════════════════════════════════════════"
echo "  🚀 analysis-resume Worker 배포"
echo "  이미지:  ${IMAGE_REPO}:${IMAGE_TAG}"
echo "  네임스페이스: ${NAMESPACE}"
echo "══════════════════════════════════════════"

# 매니페스트 적용
echo "▶ 매니페스트 적용 중..."
kubectl apply -f "${INFRA_DIR}/analysis-resume/"

# 이미지 업데이트
echo "▶ 이미지 업데이트 중..."
kubectl set image "deployment/${DEPLOYMENT}" \
  "analysis-resume-worker=${IMAGE_REPO}:${IMAGE_TAG}" \
  -n "${NAMESPACE}"

# 강제 rollout restart (새로운 Pod 생성)
echo "▶ rollout restart 중..."
kubectl rollout restart "deployment/${DEPLOYMENT}" -n "${NAMESPACE}"

# rollout 대기
echo "▶ rollout 대기 중..."
kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=300s

echo ""
echo "✅ 배포 완료: ${IMAGE_TAG}"
echo ""
echo "Pod 상태:"
kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT}"
