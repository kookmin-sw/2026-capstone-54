#!/usr/bin/env bash
#
# Voice API k3s production 배포 스크립트
#
# 사용법:
#   ./deploy-voice-api.sh <이미지태그>           # 배포
#   ./deploy-voice-api.sh rollback [리비전]      # 롤백
#   ./deploy-voice-api.sh status                 # 상태 확인
#   ./deploy-voice-api.sh history                # 배포 이력 조회
#

set -euo pipefail

NAMESPACE="mefit-backend-production"
IMAGE_REPO="teammefit/voice-api"
DEPLOYMENT="mefit-production-voice-api"

COMMAND="${1:?사용법: $0 <이미지태그|rollback|status|history> [리비전]}"

# ─── rollback / status / history 서브커맨드 ───
if [[ "$COMMAND" == "rollback" || "$COMMAND" == "status" || "$COMMAND" == "history" ]]; then
  REVISION="${2:-}"

  case "$COMMAND" in
    rollback)
      echo "══════════════════════════════════════════"
      echo "  🔄 Voice API 롤백"
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
      echo "── Voice API Deployment ──"
      kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" 2>/dev/null || true
      echo ""
      echo "── Pods ──"
      kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT}" -o wide
      echo ""
      echo "── Service ──"
      kubectl get svc -n "${NAMESPACE}" "${DEPLOYMENT}"
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
echo "  🚀 Voice API 배포"
echo "  이미지:  ${IMAGE_REPO}:${IMAGE_TAG}"
echo "  네임스페이스: ${NAMESPACE}"
echo "══════════════════════════════════════════"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/../"

# 매니페스트 적용
echo "▶ 매니페스트 적용 중..."
kubectl apply -f "${INFRA_DIR}/voice-api-service.yml"
kubectl apply -f "${INFRA_DIR}/voice-api-deployment.yml"
kubectl apply -f "${INFRA_DIR}/ingress.yml"

# 이미지 업데이트
echo "▶ 이미지 업데이트 중..."
kubectl set image "deployment/${DEPLOYMENT}" \
  "voice-api=${IMAGE_REPO}:${IMAGE_TAG}" \
  -n "${NAMESPACE}"

# rollout 대기
echo "▶ rollout 대기 중..."
kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=300s

echo ""
echo "✅ 배포 완료: ${IMAGE_TAG}"
echo ""
echo "Pod 상태:"
kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT}"
echo ""
echo "Service 상태:"
kubectl get svc -n "${NAMESPACE}" "${DEPLOYMENT}"
echo ""
echo "🔗 API 엔드포인트: https://mefit-voice.xn--hy1by51c.kr"
echo "🏥 Health check: https://mefit-voice.xn--hy1by51c.kr/health"
