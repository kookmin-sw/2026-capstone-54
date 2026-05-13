#!/usr/bin/env bash
#
# k8s-monitoring (Grafana Cloud Free) helm 배포 스크립트
#
# 사용법:
#   ./deploy-monitoring.sh production           # 배포 / 업그레이드
#   ./deploy-monitoring.sh rollback [리비전]    # 직전 또는 지정 리비전으로 롤백
#   ./deploy-monitoring.sh status               # 릴리즈 + Pod 상태
#   ./deploy-monitoring.sh history              # helm 리비전 이력
#   ./deploy-monitoring.sh uninstall            # 릴리즈 제거 (Pod / CRD 모두 삭제)
#

set -euo pipefail

NAMESPACE="mefit-monitoring"
RELEASE="k8s-monitoring"
CHART="grafana/k8s-monitoring"
CHART_VERSION="^4.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/.."
VALUES_FILE="${INFRA_DIR}/monitoring/values.yaml"

COMMAND="${1:?사용법: $0 <production|rollback|status|history|uninstall> [리비전]}"

# ─── 사전 검증 ───────────────────────────────────────────────────────────────
require_helm() {
  if ! command -v helm >/dev/null 2>&1; then
    echo "❌ helm 이 설치되어 있지 않습니다."
    echo "   설치: curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"
    exit 1
  fi
}

require_repo() {
  if ! helm repo list 2>/dev/null | grep -q '^grafana\b'; then
    echo "▶ grafana helm repo 추가 중..."
    helm repo add grafana https://grafana.github.io/helm-charts
  fi
  helm repo update grafana >/dev/null
}

# ─── rollback / status / history / uninstall 서브커맨드 ─────────────────────
case "$COMMAND" in
  rollback)
    require_helm
    REVISION="${2:-0}"  # 0 = helm 의 직전 리비전
    echo "══════════════════════════════════════════"
    echo "  🔄 monitoring 롤백 (revision=${REVISION:-previous})"
    echo "══════════════════════════════════════════"
    helm rollback "${RELEASE}" "${REVISION}" -n "${NAMESPACE}" --wait --timeout 5m
    echo "✅ 롤백 완료"
    helm status "${RELEASE}" -n "${NAMESPACE}"
    exit 0
    ;;

  status)
    require_helm
    echo "── helm release ──"
    helm status "${RELEASE}" -n "${NAMESPACE}" 2>/dev/null || echo "(릴리즈 없음)"
    echo ""
    echo "── Pods ──"
    kubectl get pods -n "${NAMESPACE}" -o wide 2>/dev/null || echo "(namespace 없음)"
    echo ""
    echo "── Secret 확인 ──"
    if kubectl get secret grafana-cloud-credentials -n "${NAMESPACE}" >/dev/null 2>&1; then
      echo "✅ grafana-cloud-credentials 존재"
    else
      echo "❌ grafana-cloud-credentials 없음 — README 의 §사전 준비 참고"
    fi
    exit 0
    ;;

  history)
    require_helm
    helm history "${RELEASE}" -n "${NAMESPACE}"
    exit 0
    ;;

  uninstall)
    require_helm
    echo "══════════════════════════════════════════"
    echo "  🗑️  monitoring 릴리즈 제거"
    echo "══════════════════════════════════════════"
    read -rp "정말로 ${RELEASE} 를 제거하시겠습니까? (yes/no): " CONFIRM
    if [[ "${CONFIRM}" != "yes" ]]; then
      echo "취소됨"
      exit 0
    fi
    helm uninstall "${RELEASE}" -n "${NAMESPACE}" --wait --timeout 5m || true
    echo "✅ 릴리즈 제거 완료"
    echo "namespace 와 secret 은 유지됩니다 (필요 시 수동 삭제):"
    echo "  kubectl delete namespace ${NAMESPACE}"
    exit 0
    ;;

  production)
    ;;  # ↓ 배포 모드로 진행

  *)
    echo "❌ 유효하지 않은 명령: $COMMAND"
    echo "사용 가능: production / rollback / status / history / uninstall"
    exit 1
    ;;
esac

# ─── 배포 모드 (production) ──────────────────────────────────────────────────
require_helm
require_repo

echo "══════════════════════════════════════════"
echo "  🚀 k8s-monitoring 배포"
echo "  네임스페이스: ${NAMESPACE}"
echo "  릴리즈:       ${RELEASE}"
echo "  차트:         ${CHART} (${CHART_VERSION})"
echo "══════════════════════════════════════════"

# 1) values.yaml 존재 / 빈 값 확인
if [[ ! -f "${VALUES_FILE}" ]]; then
  echo "❌ values 파일이 없습니다: ${VALUES_FILE}"
  exit 1
fi

if grep -E '^\s*url:\s*""' "${VALUES_FILE}" >/dev/null; then
  echo ""
  echo "❌ values.yaml 의 destinations[].url 이 비어 있습니다."
  echo "   Grafana Cloud Stack → 'Send Metrics' / 'Send Logs' 패널에서"
  echo "   Prometheus / Loki endpoint URL 을 복사해 채워주세요."
  echo ""
  exit 1
fi

# 2) namespace 적용
echo "▶ namespace 확인/생성..."
kubectl apply -f "${INFRA_DIR}/monitoring/namespace.yml"

# 3) Grafana Cloud secret 검증 (배포 전에 반드시 존재해야 함)
if ! kubectl get secret grafana-cloud-credentials -n "${NAMESPACE}" >/dev/null 2>&1; then
  echo ""
  echo "❌ Secret 'grafana-cloud-credentials' 가 ${NAMESPACE} 에 없습니다."
  echo ""
  echo "   다음 중 하나로 먼저 주입하세요:"
  echo ""
  echo "   [A] kubectl 로 직접 (실 값으로 교체):"
  echo "       kubectl create secret generic grafana-cloud-credentials \\"
  echo "         --from-literal=prometheus-username='<PROM_USER>' \\"
  echo "         --from-literal=prometheus-password='<GC_API_KEY>' \\"
  echo "         --from-literal=loki-username='<LOKI_USER>' \\"
  echo "         --from-literal=loki-password='<GC_API_KEY>' \\"
  echo "         -n ${NAMESPACE}"
  echo ""
  echo "   [B] secret-template.yml 을 복사하여 값 채운 후 apply:"
  echo "       cp ${INFRA_DIR}/monitoring/secret-template.yml /tmp/gc-secret.yml"
  echo "       (편집 후) kubectl apply -f /tmp/gc-secret.yml"
  echo "       rm /tmp/gc-secret.yml   # 평문 자격증명 즉시 삭제"
  echo ""
  exit 1
fi

# 4) helm upgrade --install
echo "▶ helm upgrade --install ..."
helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NAMESPACE}" \
  --version "${CHART_VERSION}" \
  --values "${VALUES_FILE}" \
  --atomic \
  --wait \
  --timeout 10m

echo ""
echo "✅ 배포 완료"
echo ""

# 5) 상태 출력
echo "── Pods ──"
kubectl get pods -n "${NAMESPACE}" -o wide
echo ""
echo "── DaemonSet 노드별 분포 (node-exporter / alloy-metrics) ──"
kubectl get pods -n "${NAMESPACE}" -o wide --sort-by=.spec.nodeName \
  --no-headers 2>/dev/null \
  | awk '{printf "  %-50s %-15s %s\n", $1, $3, $7}'
echo ""
echo "다음 단계:"
echo "  1. grafana.com → Stack → Dashboards 에서 'Kubernetes' 폴더 확인"
echo "  2. 'Kubernetes / Compute Resources / Pod' 대시보드 열기"
echo "  3. 클러스터 필터에서 'mefit-prod-k3s' 선택"
echo ""
echo "트러블슈팅:"
echo "  kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/name=alloy --tail=100"
echo "  kubectl describe pods -n ${NAMESPACE} | grep -A5 'Events:'"
