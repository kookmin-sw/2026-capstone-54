#!/usr/bin/env bash
# Launch booth-rag embedding server(s).
#
# 기본: DUAL 모드. 한 번에 두 서버를 띄움.
#   bash scripts/run_embedding_server.sh
#     → 8080  bge-m3              (trust_remote_code=false)
#     → 8081  CodeRankEmbed       (trust_remote_code=true)
#
# 단일 모델만 원하면:
#   SINGLE=true bash scripts/run_embedding_server.sh
#     → 8080  EMBEDDING_LOCAL_MODEL (env 또는 .env)
#
# 환경변수 (선택):
#   SINGLE=true                                          ← 단일 모델 모드
#   EMBEDDING_SERVER_HOST=0.0.0.0
#   EMBEDDING_DOCS_MODEL=BAAI/bge-m3                     ← dual 모드의 docs
#   EMBEDDING_DOCS_PORT=8080
#   EMBEDDING_CODE_MODEL=nomic-ai/CodeRankEmbed          ← dual 모드의 code
#   EMBEDDING_CODE_PORT=8081
#   EMBEDDING_DEVICE=auto                                ← auto | cpu | mps | cuda
#   EMBEDDING_LOG_DIR=data                               ← 로그 디렉토리 (dual 모드)
#
# 두 서버 합쳐진 로그 보기 (별도 터미널):
#   tail -F data/embedding-docs.log data/embedding-code.log
#
# 구현 노트:
# - `uv run` 우회 (.venv/bin/uvicorn 직접). 두 번 동시 호출 시 venv lock /
#   .env 자동 로드 간섭으로 두 번째 인스턴스 부팅 실패하던 문제 회피.
# - 각 서버를 ( ... ) 서브쉘 안에서 exec — 자식 PID 가 깔끔하게 uvicorn 자체.
# - macOS BSD tail 의 --pid 미지원 → foreground tail 안 함. 운영자가 별도
#   터미널에서 tail -F 권장.

set -uo pipefail
cd "$(dirname "$0")/.."

UVICORN_BIN=".venv/bin/uvicorn"
if [[ ! -x "$UVICORN_BIN" ]]; then
    echo "❌ $UVICORN_BIN 가 없습니다. 먼저 'uv sync' 를 실행해주세요."
    exit 1
fi

HOST="${EMBEDDING_SERVER_HOST:-0.0.0.0}"
DEVICE="${EMBEDDING_DEVICE:-auto}"
SINGLE_MODE="${SINGLE:-false}"

# ── 단일 모드 ─────────────────────────────────────────────────────────
if [[ "$SINGLE_MODE" == "true" || "$SINGLE_MODE" == "1" ]]; then
    PORT="${EMBEDDING_SERVER_PORT:-8080}"
    echo "🚀 booth-rag embedding service (single mode)"
    echo "   ├─ bind:     $HOST:$PORT"
    echo "   ├─ model:    ${EMBEDDING_LOCAL_MODEL:-(from .env)}"
    echo "   ├─ trust_rc: ${EMBEDDING_TRUST_REMOTE_CODE:-false}"
    echo "   └─ backend:  local (forced)"
    echo
    exec "$UVICORN_BIN" booth_rag.server.embedding_service:app \
        --host "$HOST" --port "$PORT" "$@"
fi

# ── 듀얼 모드 (기본) ──────────────────────────────────────────────────
DOCS_MODEL="${EMBEDDING_DOCS_MODEL:-BAAI/bge-m3}"
DOCS_PORT="${EMBEDDING_DOCS_PORT:-8080}"
CODE_MODEL="${EMBEDDING_CODE_MODEL:-nomic-ai/CodeRankEmbed}"
CODE_PORT="${EMBEDDING_CODE_PORT:-8081}"
LOG_DIR="${EMBEDDING_LOG_DIR:-data}"

mkdir -p "$LOG_DIR"
DOCS_LOG="$LOG_DIR/embedding-docs.log"
CODE_LOG="$LOG_DIR/embedding-code.log"
: >"$DOCS_LOG"
: >"$CODE_LOG"

# 이미 점유된 포트 사전 차단 (사용자 혼동 방지)
for entry in "docs:$DOCS_PORT" "code:$CODE_PORT"; do
    role="${entry%%:*}"
    port="${entry##*:}"
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
        echo "❌ port $port ($role) 이 이미 사용 중입니다."
        echo "   기존 프로세스를 종료하거나 EMBEDDING_${role^^}_PORT 환경변수로 다른 포트 지정."
        exit 1
    fi
done

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
echo "   ├─ device: $DEVICE"
echo "   ├─ logs  : $DOCS_LOG"
echo "   └─         $CODE_LOG"
echo

(
    EMBEDDING_LOCAL_MODEL="$DOCS_MODEL"
    EMBEDDING_TRUST_REMOTE_CODE=false
    EMBEDDING_DEVICE="$DEVICE"
    EMBEDDING_SERVER_HOST="$HOST"
    EMBEDDING_SERVER_PORT="$DOCS_PORT"
    export EMBEDDING_LOCAL_MODEL EMBEDDING_TRUST_REMOTE_CODE EMBEDDING_DEVICE EMBEDDING_SERVER_HOST EMBEDDING_SERVER_PORT
    exec "$UVICORN_BIN" booth_rag.server.embedding_service:app \
        --host "$HOST" --port "$DOCS_PORT" "$@" \
        >>"$DOCS_LOG" 2>&1
) &
DOCS_PID=$!
echo "   ⏳ docs server  pid=$DOCS_PID  port=$DOCS_PORT  →  $DOCS_LOG"

(
    EMBEDDING_LOCAL_MODEL="$CODE_MODEL"
    EMBEDDING_TRUST_REMOTE_CODE=true
    EMBEDDING_DEVICE="$DEVICE"
    EMBEDDING_SERVER_HOST="$HOST"
    EMBEDDING_SERVER_PORT="$CODE_PORT"
    export EMBEDDING_LOCAL_MODEL EMBEDDING_TRUST_REMOTE_CODE EMBEDDING_DEVICE EMBEDDING_SERVER_HOST EMBEDDING_SERVER_PORT
    exec "$UVICORN_BIN" booth_rag.server.embedding_service:app \
        --host "$HOST" --port "$CODE_PORT" "$@" \
        >>"$CODE_LOG" 2>&1
) &
CODE_PID=$!
echo "   ⏳ code server  pid=$CODE_PID  port=$CODE_PORT  →  $CODE_LOG"

echo
echo "두 서버가 모두 LISTEN 시작할 때까지 대기 중 (모델 로드 ~10-60s)..."

WAIT_LIMIT=120
for i in $(seq 1 $WAIT_LIMIT); do
    docs_up=0
    code_up=0
    lsof -nP -iTCP:"$DOCS_PORT" -sTCP:LISTEN >/dev/null 2>&1 && docs_up=1
    lsof -nP -iTCP:"$CODE_PORT" -sTCP:LISTEN >/dev/null 2>&1 && code_up=1

    if [[ $docs_up -eq 1 && $code_up -eq 1 ]]; then
        echo "✅ 두 서버 모두 LISTEN (${i}s 소요)"
        echo "     curl http://localhost:$DOCS_PORT/info"
        echo "     curl http://localhost:$CODE_PORT/info"
        break
    fi

    if ! kill -0 "$DOCS_PID" 2>/dev/null; then
        echo "❌ docs server (pid=$DOCS_PID) 가 죽었습니다. 마지막 로그 ──"
        tail -n 30 "$DOCS_LOG"
        exit 1
    fi
    if ! kill -0 "$CODE_PID" 2>/dev/null; then
        echo "❌ code server (pid=$CODE_PID) 가 죽었습니다. 마지막 로그 ──"
        tail -n 30 "$CODE_LOG"
        exit 1
    fi

    if [[ $i -eq $WAIT_LIMIT ]]; then
        echo "⚠️ ${WAIT_LIMIT}s 안에 두 포트 모두 LISTEN 안 됐습니다. docs=${docs_up} code=${code_up}"
        echo "   로그 확인: tail $DOCS_LOG $CODE_LOG"
    fi

    sleep 1
done

echo
echo "별도 터미널에서 로그 보기:"
echo "  tail -F $DOCS_LOG $CODE_LOG"
echo
echo "Ctrl-C 한 번으로 두 서버 모두 종료됩니다."

wait "$DOCS_PID" "$CODE_PID"
