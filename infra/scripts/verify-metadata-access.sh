#!/usr/bin/env bash
#
# EC2 메타데이터 서비스 접근 검증 스크립트
#
# 사용법:
#   ./verify-metadata-access.sh
#

set -euo pipefail

echo "══════════════════════════════════════════"
echo "  EC2 메타데이터 접근 검증"
echo "══════════════════════════════════════════"

METADATA_IP="169.254.169.254"
POD_CIDR="10.42.0.0/24"
NAMESPACE="mefit-backend-production"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

fail() {
  echo -e "${RED}❌ $1${NC}"
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "▶ 1. iptables 규칙 확인"
echo ""

if sudo iptables -t nat -L PREROUTING -n | grep -q "$METADATA_IP"; then
  pass "NAT PREROUTING 규칙 존재"
else
  fail "NAT PREROUTING 규칙 없음"
  echo "   sudo ./setup-metadata-access.sh 를 실행하세요"
  exit 1
fi

if sudo iptables -L FORWARD -n | grep -q "$METADATA_IP"; then
  pass "FORWARD 규칙 존재"
else
  fail "FORWARD 규칙 없음"
  echo "   sudo ./setup-metadata-access.sh 를 실행하세요"
  exit 1
fi

echo ""
echo "▶ 2. K3s 클러스터 상태 확인"
echo ""

if kubectl cluster-info &>/dev/null; then
  pass "K3s 클러스터 접근 가능"
else
  fail "K3s 클러스터 접근 불가"
  exit 1
fi

echo ""
echo "▶ 3. Pod 네트워크 CIDR 확인"
echo ""

ACTUAL_CIDR=$(kubectl get nodes -o jsonpath='{.items[0].spec.podCIDR}' 2>/dev/null || echo "")
if [[ "$ACTUAL_CIDR" == "$POD_CIDR" ]]; then
  pass "Pod CIDR: $ACTUAL_CIDR"
else
  warn "Pod CIDR 불일치: 예상=$POD_CIDR, 실제=$ACTUAL_CIDR"
  echo "   iptables 규칙의 CIDR을 $ACTUAL_CIDR 로 수정해야 할 수 있습니다"
fi

echo ""
echo "▶ 4. 테스트 Pod로 메타데이터 접근 테스트"
echo ""

echo "   테스트 Pod 생성 중..."
if kubectl run test-metadata-verify \
  --image=curlimages/curl \
  --restart=Never \
  --rm \
  -i \
  --timeout=30s \
  -- curl -s -m 5 http://169.254.169.254/latest/meta-data/ &>/dev/null; then
  pass "메타데이터 서비스 접근 성공"
else
  fail "메타데이터 서비스 접근 실패"
  echo ""
  echo "   디버깅 명령어:"
  echo "   kubectl run test-debug --image=curlimages/curl --rm -it --restart=Never -- sh"
  echo "   # Pod 내부에서:"
  echo "   curl -v http://169.254.169.254/latest/meta-data/"
  exit 1
fi

echo ""
echo "▶ 5. IAM Role 자격증명 확인"
echo ""

echo "   boto3로 자격증명 확인 중..."
CREDS_TEST=$(kubectl run test-boto3-creds \
  --image=python:3.12-slim \
  --restart=Never \
  --rm \
  -i \
  --timeout=60s \
  --command -- bash -c "pip install -q boto3 && python -c \"
import boto3
try:
    session = boto3.Session()
    creds = session.get_credentials()
    if creds:
        print(f'SUCCESS:{creds.access_key[:10]}')
    else:
        print('FAIL:No credentials')
except Exception as e:
    print(f'ERROR:{e}')
\"" 2>/dev/null || echo "ERROR:Pod failed")

if echo "$CREDS_TEST" | grep -q "SUCCESS:"; then
  ACCESS_KEY=$(echo "$CREDS_TEST" | grep "SUCCESS:" | cut -d':' -f2)
  pass "IAM 자격증명 획득 성공"
  echo "   Access Key: ${ACCESS_KEY}..."
else
  fail "IAM 자격증명 획득 실패"
  echo "   $CREDS_TEST"
fi

echo ""
echo "▶ 6. 실제 Pod에서 AWS SDK 테스트 (선택사항)"
echo ""

read -p "   실제 Django Pod에서 boto3 테스트를 실행하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=mefit-production-api -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
  
  if [[ -n "$POD_NAME" ]]; then
    echo "   Pod: $POD_NAME"
    echo "   boto3 테스트 실행 중..."
    
    BOTO3_TEST=$(kubectl exec -n "$NAMESPACE" "$POD_NAME" -- python -c "
import boto3
try:
    session = boto3.Session()
    creds = session.get_credentials()
    if creds:
        print(f'SUCCESS:{creds.access_key[:10]}')
    else:
        print('FAIL:No credentials')
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null || echo "ERROR:Command failed")

    if echo "$BOTO3_TEST" | grep -q "SUCCESS:"; then
      ACCESS_KEY=$(echo "$BOTO3_TEST" | grep "SUCCESS:" | cut -d':' -f2)
      pass "Django Pod에서 boto3 작동 확인"
      echo "   Access Key: ${ACCESS_KEY}..."
    else
      fail "Django Pod에서 boto3 실패"
      echo "   $BOTO3_TEST"
    fi
  else
    warn "Django Pod를 찾을 수 없습니다"
  fi
else
  echo "   스킵"
fi

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ 검증 완료!"
echo "══════════════════════════════════════════"
echo ""
echo "모든 테스트를 통과했습니다."
echo "Pod에서 EC2 IAM Role을 사용하여 AWS 서비스에 접근할 수 있습니다."
echo ""
