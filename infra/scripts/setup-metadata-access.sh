#!/usr/bin/env bash
#
# EC2 메타데이터 서비스 접근 설정 스크립트
#
# 사용법:
#   sudo ./setup-metadata-access.sh
#

set -euo pipefail

echo "══════════════════════════════════════════"
echo "  EC2 메타데이터 서비스 접근 설정"
echo "══════════════════════════════════════════"

# Root 권한 확인
if [[ $EUID -ne 0 ]]; then
   echo "❌ 이 스크립트는 root 권한이 필요합니다."
   echo "   sudo ./setup-metadata-access.sh 로 실행하세요."
   exit 1
fi

POD_CIDR="10.42.0.0/24"
METADATA_IP="169.254.169.254"

echo ""
echo "▶ 현재 iptables 규칙 확인 중..."
echo ""

# 기존 규칙 확인
if iptables -t nat -L PREROUTING -n | grep -q "$METADATA_IP"; then
  echo "⚠️  기존 메타데이터 접근 규칙이 이미 존재합니다."
  read -p "   기존 규칙을 삭제하고 다시 추가하시겠습니까? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "▶ 기존 규칙 삭제 중..."
    iptables -t nat -D PREROUTING -s "$POD_CIDR" -d "$METADATA_IP" -p tcp -m tcp --dport 80 -j ACCEPT 2>/dev/null || true
    iptables -D FORWARD -s "$POD_CIDR" -d "$METADATA_IP" -j ACCEPT 2>/dev/null || true
  else
    echo "✅ 기존 규칙 유지"
    exit 0
  fi
fi

echo ""
echo "▶ iptables 규칙 추가 중..."

# NAT 규칙 추가
iptables -t nat -A PREROUTING -s "$POD_CIDR" -d "$METADATA_IP" -p tcp -m tcp --dport 80 -j ACCEPT

# FORWARD 규칙 추가
iptables -A FORWARD -s "$POD_CIDR" -d "$METADATA_IP" -j ACCEPT

echo "✅ iptables 규칙 추가 완료"

echo ""
echo "▶ 규칙 확인:"
echo ""
echo "--- NAT PREROUTING ---"
iptables -t nat -L PREROUTING -n -v | grep "$METADATA_IP" || echo "(규칙 없음)"
echo ""
echo "--- FORWARD ---"
iptables -L FORWARD -n -v | grep "$METADATA_IP" || echo "(규칙 없음)"

echo ""
echo "▶ 영구 저장 설정 중..."

# iptables-persistent 설치 확인
if ! dpkg -l | grep -q iptables-persistent; then
  echo "   iptables-persistent 설치 중..."
  DEBIAN_FRONTEND=noninteractive apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables-persistent
fi

# 규칙 저장
netfilter-persistent save

echo "✅ 규칙 영구 저장 완료"

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ 설정 완료!"
echo "══════════════════════════════════════════"
echo ""
echo "다음 단계:"
echo "1. Pod에서 메타데이터 접근 테스트:"
echo "   kubectl run test-metadata --image=curlimages/curl --rm -it --restart=Never -- curl -s http://169.254.169.254/latest/meta-data/"
echo ""
echo "2. 자세한 검증 방법은 EC2_METADATA_ACCESS.md 참고"
echo ""
