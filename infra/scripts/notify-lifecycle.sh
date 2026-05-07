#!/usr/bin/env bash
#
# EC2 lifecycle Slack 알림 스크립트
#
# systemd notify-lifecycle.service 가 boot / shutdown 시 호출합니다.
# 직접 실행하지 마세요 (systemd 가 환경 변수를 주입함).
#
# 사용법:
#   notify-lifecycle.sh <boot|shutdown>
#
# 환경 변수 (systemd EnvironmentFile=/etc/default/notify-lifecycle):
#   SLACK_WEBHOOK_URL  - 필수. https://hooks.slack.com/services/.../.../...
#
# 실패 정책:
#   - WEBHOOK_URL 미설정 → logger 경고만 남기고 exit 0 (systemd 유닛 실패 X)
#   - 메타데이터 조회 실패 → "unknown" 으로 대체
#   - Slack 전송 실패 → logger 경고만 남기고 exit 0
#
# IMDSv2 토큰 + 5초 타임아웃으로 shutdown 시 네트워크 단절에 대비합니다.
#

set -euo pipefail

EVENT="${1:-unknown}"

WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

if [[ -z "${WEBHOOK_URL}" ]]; then
  logger -t notify-lifecycle "ERROR: SLACK_WEBHOOK_URL not set; skipping ${EVENT} notification"
  exit 0
fi

# shutdown 시점에는 네트워크가 곧 끊기므로 IMDSv2 호출은 3초 best-effort.
TOKEN=$(
  curl -s -m 3 -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null \
    || true
)

get_meta() {
  local key="$1"
  if [[ -n "${TOKEN}" ]]; then
    curl -s -m 3 -H "X-aws-ec2-metadata-token: ${TOKEN}" \
      "http://169.254.169.254/latest/meta-data/${key}" 2>/dev/null \
      || echo "unknown"
  else
    echo "unknown"
  fi
}

INSTANCE_ID=$(get_meta "instance-id")
INSTANCE_TYPE=$(get_meta "instance-type")
AZ=$(get_meta "placement/availability-zone")
HOSTNAME_VAL=$(hostname)
TIMESTAMP=$(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S %Z' 2>/dev/null || date '+%Y-%m-%d %H:%M:%S %Z')

case "${EVENT}" in
  boot)
    EMOJI=":green_heart:"
    LABEL="시작됨 (boot)"
    COLOR="good"
    ;;
  shutdown)
    EMOJI=":zzz:"
    LABEL="정지됨 (shutdown)"
    COLOR="warning"
    ;;
  *)
    EMOJI=":grey_question:"
    LABEL="${EVENT}"
    COLOR="#888888"
    ;;
esac

PAYLOAD=$(cat <<JSON
{
  "attachments": [
    {
      "color": "${COLOR}",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "${EMOJI} *EC2 ${LABEL}* — \`${HOSTNAME_VAL}\`"
          }
        },
        {
          "type": "section",
          "fields": [
            {"type": "mrkdwn", "text": "*Instance ID:*\n\`${INSTANCE_ID}\`"},
            {"type": "mrkdwn", "text": "*Type:*\n${INSTANCE_TYPE}"},
            {"type": "mrkdwn", "text": "*AZ:*\n${AZ}"},
            {"type": "mrkdwn", "text": "*Time:*\n${TIMESTAMP}"}
          ]
        }
      ]
    }
  ]
}
JSON
)

if curl -s -X POST \
     -H 'Content-Type: application/json' \
     --data "${PAYLOAD}" \
     --max-time 5 \
     "${WEBHOOK_URL}" >/dev/null 2>&1; then
  logger -t notify-lifecycle "Sent ${EVENT} notification for ${HOSTNAME_VAL} (${INSTANCE_ID})"
else
  logger -t notify-lifecycle "WARN: Slack webhook send failed for ${EVENT} on ${HOSTNAME_VAL}"
fi

exit 0
