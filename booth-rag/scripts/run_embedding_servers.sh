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
#
# 구현 노트: `uv run` 을 우회하고 .venv/bin/uvicorn 을 직접 호출합니다.
# `uv run` 을 두 번 동시에 부르면 (a) venv lock 으로 직렬화되거나
# (b) 자동 .env 로드가 inline env override 를 덮어쓸 수 있어서 두 번째
# 서버가 정상 부팅 못 하는 경우가 있었습니다.

set -uo pipefail
cd "$(dirname "$0")/.."

HOST="${EMBEDDING_SERVER_HOST:-0.0.0.0}"
DOCS_MODEL="${EMBEDDING_DOCS_MODEL:-BAAI/bge-m3}"
DOCS_PORT="${EMBEDDING_DOCS_PORT:-8080}"
CODE_MODEL="${EMBEDDING_CODE_MODEL:-nomic-ai/CodeRankEmbed}"
CODE_PORT="${EMBEDDING_CODE_PORT:-8081}"
DEVICE="${EMBEDDING_DEVICE:-auto}"

UVICORN_BIN=".venv/bin/uvicorn"
if [[ ! -x "$UVICORN_BIN" ]]; then
    echo "❌ $UVICORN_BIN 가 없습니다. 먼저 'uv sync' 를 실행해주세요."
    exit 1
fi

DOCS_PID=""
CODE_PID=""

cleanup() {
    echo
    echo "🛑 종료 — 두 임베딩 서버 정리 중..."
    if [[ -n "$DOCS_PID" ]] && kill -0 "$DOCS_PID" 2>/dev/null; then
        kill -TERM "$DOCS_PID" 2>/dev/null || true
    fi
    if [[ -n "$CODE_PID" ]] && kill -0 "$CODE_PID" 2>/dev/null; then
        kill -TERM "$CODE_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "🚀 booth-rag dual embedding servers"
echo "   ├─ docs  : $HOST:$DOCS_PORT  →  $DOCS_MODEL          (trust_remote_code=false)"
echo "   ├─ code  : $HOST:$CODE_PORT  →  $CODE_MODEL          (trust_remote_code=true)"
echo "   └─ device: $DEVICE"
echo

# ── 1번 서버 (docs) — .venv/bin/uvicorn 직접 호출 (uv run 우회) ────────
EMBEDDING_LOCAL_MODEL="$DOCS_MODEL" \
EMBEDDING_TRUST_REMOTE_CODE=false \
EMBEDDING_DEVICE="$DEVICE" \
EMBEDDING_SERVER_HOST="$HOST" \
EMBEDDING_SERVER_PORT="$DOCS_PORT" \
"$UVICORN_BIN" booth_rag.server.embedding_service:app \
    --host "$HOST" --port "$DOCS_PORT" "$@" &
DOCS_PID=$!
echo "   ⏳ docs server  pid=$DOCS_PID  port=$DOCS_PORT"

# ── 2번 서버 (code) — trust_remote_code=true 강제 ────────────────────
EMBEDDING_LOCAL_MODEL="$CODE_MODEL" \
EMBEDDING_TRUST_REMOTE_CODE=true \
EMBEDDING_DEVICE="$DEVICE" \
EMBEDDING_SERVER_HOST="$HOST" \
EMBEDDING_SERVER_PORT="$CODE_PORT" \
"$UVICORN_BIN" booth_rag.server.embedding_service:app \
    --host "$HOST" --port "$CODE_PORT" "$@" &
CODE_PID=$!
echo "   ⏳ code server  pid=$CODE_PID  port=$CODE_PORT"

echo
echo "8초 후 두 프로세스 생존 확인 (첫 부팅이라 모델 로드 + prewarm 까지 ~30-60s 더 걸림)..."
sleep 8

if ! kill -0 "$DOCS_PID" 2>/dev/null; then
    echo "❌ docs server (pid=$DOCS_PID) 가 죽었습니다."
    echo "   확인: port $DOCS_PORT 충돌? 모델 로드 실패? 위 로그 참고."
    exit 1
fi
if ! kill -0 "$CODE_PID" 2>/dev/null; then
    echo "❌ code server (pid=$CODE_PID) 가 죽었습니다."
    echo "   확인: port $CODE_PORT 충돌? CodeRankEmbed 다운로드 실패?"
    echo "        einops 누락? trust_remote_code 처리 실패? 위 로그 참고."
    exit 1
fi

echo "✅ 두 프로세스 살아있음. 모델 로드 + Rotary cache prewarm 완료까지 대기."
echo "   각 서버가 'Embedding service ready' 찍으면 ready."
echo "   확인: curl http://localhost:$DOCS_PORT/info  /  curl http://localhost:$CODE_PORT/info"
echo "   Ctrl-C 한 번으로 둘 다 종료됩니다."
echo

wait "$DOCS_PID" "$CODE_PID"
