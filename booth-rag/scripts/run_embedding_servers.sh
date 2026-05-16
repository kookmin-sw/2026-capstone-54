#!/usr/bin/env bash
# Launch BOTH booth-rag embedding servers (docs + code) in one terminal.
#
# 한 머신에서 듀얼 모드 운영하려면 두 인스턴스가 필요한데 매번 두 터미널
# 열기 귀찮은 케이스. 이 스크립트가 두 프로세스를 백그라운드로 띄우고
# Ctrl-C 한 번으로 둘 다 정리합니다.
#
# Env template for this script: .env.server.sample
# Env overrides (선택):
#   EMBEDDING_SERVER_HOST     bind host          (default 0.0.0.0)
#   EMBEDDING_DOCS_MODEL      문서 모델           (default BAAI/bge-m3)
#   EMBEDDING_DOCS_PORT       문서 서버 포트       (default 8080)
#   EMBEDDING_CODE_MODEL      코드 모델           (default nomic-ai/CodeRankEmbed)
#   EMBEDDING_CODE_PORT       코드 서버 포트       (default 8081)
#   EMBEDDING_DEVICE          auto | cpu | mps | cuda
#
# Usage:
#   bash scripts/run_embedding_servers.sh
#   EMBEDDING_DOCS_PORT=9000 EMBEDDING_CODE_PORT=9001 bash scripts/run_embedding_servers.sh
#
# 단일 모델만 띄우려면 기존 scripts/run_embedding_server.sh (단수형) 사용.

set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${EMBEDDING_SERVER_HOST:-0.0.0.0}"
DOCS_MODEL="${EMBEDDING_DOCS_MODEL:-BAAI/bge-m3}"
DOCS_PORT="${EMBEDDING_DOCS_PORT:-8080}"
CODE_MODEL="${EMBEDDING_CODE_MODEL:-nomic-ai/CodeRankEmbed}"
CODE_PORT="${EMBEDDING_CODE_PORT:-8081}"
DEVICE="${EMBEDDING_DEVICE:-auto}"

cleanup() {
    local exit_code=$?
    echo
    echo "🛑 종료 신호 — 두 임베딩 서버 정리 중..."
    if [[ -n "${DOCS_PID:-}" ]] && kill -0 "$DOCS_PID" 2>/dev/null; then
        kill -TERM "$DOCS_PID" 2>/dev/null || true
    fi
    if [[ -n "${CODE_PID:-}" ]] && kill -0 "$CODE_PID" 2>/dev/null; then
        kill -TERM "$CODE_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    exit "$exit_code"
}
trap cleanup INT TERM EXIT

echo "🚀 booth-rag dual embedding servers"
echo "   ├─ docs  : $HOST:$DOCS_PORT  →  $DOCS_MODEL  (trust_remote_code=false)"
echo "   ├─ code  : $HOST:$CODE_PORT  →  $CODE_MODEL  (trust_remote_code=true)"
echo "   └─ device: $DEVICE"
echo

EMBEDDING_LOCAL_MODEL="$DOCS_MODEL" \
EMBEDDING_TRUST_REMOTE_CODE=false \
EMBEDDING_DEVICE="$DEVICE" \
EMBEDDING_SERVER_HOST="$HOST" \
EMBEDDING_SERVER_PORT="$DOCS_PORT" \
uv run uvicorn booth_rag.server.embedding_service:app \
    --host "$HOST" --port "$DOCS_PORT" "$@" &
DOCS_PID=$!
echo "   ⏳ docs server pid=$DOCS_PID"

EMBEDDING_LOCAL_MODEL="$CODE_MODEL" \
EMBEDDING_TRUST_REMOTE_CODE=true \
EMBEDDING_DEVICE="$DEVICE" \
EMBEDDING_SERVER_HOST="$HOST" \
EMBEDDING_SERVER_PORT="$CODE_PORT" \
uv run uvicorn booth_rag.server.embedding_service:app \
    --host "$HOST" --port "$CODE_PORT" "$@" &
CODE_PID=$!
echo "   ⏳ code server pid=$CODE_PID"

echo
echo "✅ 두 서버 부팅 중 — 로그가 섞여서 흐르는 게 정상."
echo "   각 서버가 'Rotary cache prewarmed' / 'Embedding service ready' 찍으면 ready."
echo "   Ctrl-C 한 번으로 둘 다 종료됩니다."
echo

wait "$DOCS_PID" "$CODE_PID"
