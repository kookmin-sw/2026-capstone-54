#!/usr/bin/env bash
#
# EC2 lifecycle Slack 알림 1회 설치 스크립트
#
# 설치 대상:
#   /usr/local/bin/notify-lifecycle.sh             (실행 스크립트)
#   /etc/default/notify-lifecycle                  (Webhook URL, 0600 root)
#   /etc/systemd/system/notify-lifecycle.service   (systemd 유닛)
#
# 동작:
#   - boot 시 ExecStart 가 호출되어 시작 알림 1회
#   - shutdown 시 ExecStop 이 호출되어 정지 알림 1회
#   - hibernate / force-stop / kernel panic 시에는 hook 미실행 (제약사항)
#
# 사용법:
#   sudo ./setup-shutdown-notify.sh '<SLACK_WEBHOOK_URL>'
#
# 예:
#   sudo ./setup-shutdown-notify.sh 'https://hooks.slack.com/services/T01/B02/abc123'
#

set -euo pipefail

echo "══════════════════════════════════════════"
echo "  EC2 lifecycle Slack 알림 설정"
echo "══════════════════════════════════════════"

if [[ $EUID -ne 0 ]]; then
   echo "❌ root 권한이 필요합니다."
   echo "   sudo ./setup-shutdown-notify.sh '<WEBHOOK_URL>' 로 실행하세요."
   exit 1
fi

if [[ $# -lt 1 ]]; then
   echo "❌ Webhook URL 인자 누락"
   echo ""
   echo "   사용법: sudo $0 '<SLACK_WEBHOOK_URL>'"
   echo "   예:     sudo $0 'https://hooks.slack.com/services/T.../B.../...'"
   exit 1
fi

WEBHOOK_URL="$1"

if [[ ! "${WEBHOOK_URL}" =~ ^https://hooks\.slack\.com/services/ ]]; then
   echo "⚠️  Webhook URL 이 https://hooks.slack.com/services/ 로 시작하지 않습니다."
   read -p "   계속하시겠습니까? (y/N): " -n 1 -r
   echo
   [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOTIFY_SCRIPT_SRC="${SCRIPT_DIR}/notify-lifecycle.sh"

if [[ ! -f "${NOTIFY_SCRIPT_SRC}" ]]; then
   echo "❌ ${NOTIFY_SCRIPT_SRC} 가 없습니다."
   echo "   git clone 후 infra/scripts/ 안에서 실행해주세요."
   exit 1
fi

echo ""
echo "▶ 알림 스크립트 설치 중..."
install -m 0755 -o root -g root "${NOTIFY_SCRIPT_SRC}" /usr/local/bin/notify-lifecycle.sh
echo "✅ /usr/local/bin/notify-lifecycle.sh"

echo ""
echo "▶ Webhook URL 저장 (/etc/default/notify-lifecycle, 0600)..."
umask 077
cat > /etc/default/notify-lifecycle <<EOF
SLACK_WEBHOOK_URL="${WEBHOOK_URL}"
EOF
chmod 0600 /etc/default/notify-lifecycle
chown root:root /etc/default/notify-lifecycle
umask 022
echo "✅ /etc/default/notify-lifecycle"

echo ""
echo "▶ systemd 유닛 등록..."
cat > /etc/systemd/system/notify-lifecycle.service <<'EOF'
[Unit]
Description=Notify Slack on EC2 boot/shutdown
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
EnvironmentFile=-/etc/default/notify-lifecycle
ExecStart=/usr/local/bin/notify-lifecycle.sh boot
ExecStop=/usr/local/bin/notify-lifecycle.sh shutdown
TimeoutStartSec=15
TimeoutStopSec=15
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
chmod 0644 /etc/systemd/system/notify-lifecycle.service
echo "✅ /etc/systemd/system/notify-lifecycle.service"

echo ""
echo "▶ 유닛 활성화..."
systemctl daemon-reload
systemctl enable notify-lifecycle.service
echo "✅ notify-lifecycle.service enabled (다음 boot 부터 자동 알림)"

echo ""
echo "──────────────────────────────────────────"
echo "  ✅ 설치 완료"
echo "──────────────────────────────────────────"
echo ""
echo "지금 즉시 boot 알림 보내서 동작 확인:"
echo "  sudo systemctl start notify-lifecycle.service"
echo ""
echo "지금 즉시 shutdown 알림 보내서 동작 확인 (재부팅 X):"
echo "  sudo systemctl stop notify-lifecycle.service"
echo ""
echo "로그 확인:"
echo "  journalctl -u notify-lifecycle.service -n 50"
echo "  journalctl -t notify-lifecycle -n 50"
echo ""
echo "Webhook URL 변경:"
echo "  sudo ./setup-shutdown-notify.sh '<새 URL>' 로 다시 실행"
echo ""
echo "제거:"
echo "  sudo systemctl disable --now notify-lifecycle.service"
echo "  sudo rm /etc/systemd/system/notify-lifecycle.service"
echo "  sudo rm /etc/default/notify-lifecycle"
echo "  sudo rm /usr/local/bin/notify-lifecycle.sh"
echo "  sudo systemctl daemon-reload"
echo ""
echo "⚠️  hibernate / force-stop / kernel panic 시에는 알림이 발송되지 않습니다."
echo "   강제 종료까지 추적하려면 EventBridge + Lambda 추가 권장."
echo ""
