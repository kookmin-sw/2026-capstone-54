#!/usr/bin/env bash
#
# LLM Gateway (LiteLLM Proxy) k3s production 배포 스크립트
#
# 사용법:
#   ./deploy-llm-gateway.sh production           # 배포
#   ./deploy-llm-gateway.sh rollback [리비전]    # 롤백
#   ./deploy-llm-gateway.sh status               # 상태 확인
#   ./deploy-llm-gateway.sh history              # 배포 이력 조회
#

set -euo pipefail

NAMESPACE="mefit-backend-production"
DEPLOYMENT="mefit-production-llm-gateway"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/.."

COMMAND="${1:?사용법: $0 <production|rollback|status|history> [리비전]}"

# ─── rollback / status / history 서브커맨드 ───
if [[ "$COMMAND" == "rollback" || "$COMMAND" == "status" || "$COMMAND" == "history" ]]; then
  REVISION="${2:-}"

  case "$COMMAND" in
    rollback)
      echo "══════════════════════════════════════════"
      echo "  🔄 LLM Gateway 롤백"
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
      echo "── LLM Gateway Deployment ──"
      kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" 2>/dev/null || true
      echo ""
      echo "── Pods ──"
      kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT}" -o wide
      echo ""
      echo "── Service Endpoints ──"
      kubectl get endpoints mefit-llm-gateway -n "${NAMESPACE}"
      ;;

    history)
      echo "── ${DEPLOYMENT} ──"
      kubectl rollout history "deployment/${DEPLOYMENT}" -n "${NAMESPACE}"
      ;;
  esac

  exit 0
fi

# ─── 배포 모드 (production) ───
if [[ "$COMMAND" != "production" ]]; then
  echo "❌ 유효하지 않은 명령: $COMMAND"
  echo "사용 가능: production / rollback / status / history"
  exit 1
fi

echo "══════════════════════════════════════════"
echo "  🚀 LLM Gateway 배포"
echo "  네임스페이스: ${NAMESPACE}"
echo "══════════════════════════════════════════"

# 매니페스트 적용
echo "▶ ConfigMap / Service / Deployment 적용 중..."
kubectl apply -f "${INFRA_DIR}/llm-gateway/configmap.yml"
kubectl apply -f "${INFRA_DIR}/llm-gateway/service.yml"
kubectl apply -f "${INFRA_DIR}/llm-gateway/ingress.yml"
kubectl apply -f "${INFRA_DIR}/llm-gateway/deployment.yml"

# Secret 존재 확인 (외부 주입)
if ! kubectl get secret mefit-production-llm-gateway-secret -n "${NAMESPACE}" >/dev/null 2>&1; then
  echo ""
  echo "⚠️  WARNING: Secret 'mefit-production-llm-gateway-secret' 가 존재하지 않습니다."
  echo "    GitHub Environment secrets 에서 다음 키를 등록하고 배포 워크플로우를 실행하세요:"
  echo "      - LITELLM_MASTER_KEY"
  echo "      - DATABASE_URL"
  echo "      - OPENAI_API_KEY"
  echo "      - GEMINI_API_KEY (선택)"
  echo "      - UI_USERNAME (어드민 UI 로그인 ID)"
  echo "      - UI_PASSWORD (어드민 UI 로그인 비밀번호)"
  echo ""
  echo "    Pod 는 ImagePullBackOff 또는 CrashLoopBackOff 상태가 될 수 있습니다."
  echo ""
fi

# 강제 rollout restart (config 변경 반영)
echo "▶ rollout restart 중..."
kubectl rollout restart "deployment/${DEPLOYMENT}" -n "${NAMESPACE}"

# rollout 대기
echo "▶ rollout 대기 중..."
kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=300s

echo ""
echo "✅ 배포 완료"
echo ""
echo "Pod 상태:"
kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT}"
echo ""
echo "내부 엔드포인트: http://mefit-llm-gateway:4000/v1"
echo "어드민 UI 접근: https://api.mefit.kr/admin/llm-gateway/ui (Django admin 인증 후 LiteLLM UI 로그인)"
echo "  비상시 port-forward: kubectl port-forward -n ${NAMESPACE} svc/mefit-llm-gateway 4000:4000"
echo "                   → http://localhost:4000/admin/llm-gateway/ui (SERVER_ROOT_PATH prefix 필수)"
