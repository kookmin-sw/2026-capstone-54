#!/usr/bin/env bash
# Launch BOTH booth-rag embedding servers (docs + code) in one terminal.
#
# 한 머신에서 듀얼 모드 운영하려면 두 인스턴스가 필요. 이 스크립트가 두
# 프로세스를 자식으로 분리해서 띄우고, 각 로그를 분리된 파일에 쓰고,
# 메인 스크립트에서 둘을 tail -F 로 함께 보여줍니다. Ctrl-C 한 번으로
# 두 서버 모두 안전 종료.
#
# Env template for this script: .env.server.sample
# Env overrides (선택):
#   EMBEDDING_SERVER_HOST     bind host          (default 0.0.0.0)
#   EMBEDDING_DOCS_MODEL      문서 모델           (default BAAI/bge-m3)
#   EMBEDDING_DOCS_PORT       문서 서버 포트       (default 8080)
#   EMBEDDING_CODE_MODEL      코드 모델           (default nomic-ai/CodeRankEmbed)
#   EMBEDDING_CODE_PORT       코드 서버 포트       (default 8081)
#   EMBEDDING_DEVICE          auto | cpu | mps | cuda
#   EMBEDDING_LOG_DIR         로그 디렉토리         (default data/)
#
# Usage:
#   bash scripts/run_embedding_servers.sh
#   EMBEDDING_DOCS_PORT=9000 EMBEDDING_CODE_PORT=9001 bash scripts/run_embedding_servers.sh
#
# 단일 모델만 띄우려면 기존 scripts/run_embedding_server.sh (단수형) 사용.
#
# 구현 노트:
# (1) `uv run` 우회 — .venv/bin/uvicorn 을 직접 호출. 두 번 동시 호출 시
#     uv 의 venv lock / .env 자동 로드 간섭으로 두 번째 인스턴스가 부팅
#     실패하던 이슈 방지.
# (2) 각 서버를 ( ... ) 서브쉘 안에서 exec — 자식 PID 가 깔끔하게 uvicorn
#     프로세스 자체. inline env vars 가 그 자식에게만 적용.
# (3) 로그를 파일로 분리 — 두 uvicorn 의 stdout/stderr 가 섞이지 않음.
#     첫 부팅 시 어느 쪽이 멈췄는지 즉시 확인 가능.

set -uo pipefail
cd "$(dirname "$0")/.."

HOST="${EMBEDDING_SERVER_HOST:-0.0.0.0}"
DOCS_MODEL="${EMBEDDING_DOCS_MODEL:-BAAI/bge-m3}"
DOCS_PORT="${EMBEDDING_DOCS_PORT:-8080}"
CODE_MODEL="${EMBEDDING_CODE_MODEL:-nomic-ai/CodeRankEmbed}"
CODE_PORT="${EMBEDDING_CODE_PORT:-8081}"
DEVICE="${EMBEDDING_DEVICE:-auto}"
LOG_DIR="${EMBEDDING_LOG_DIR:-data}"

UVICORN_BIN=".venv/bin/uvicorn"
if [[ ! -x "$UVICORN_BIN" ]]; then
    echo "❌ $UVICORN_BIN 가 없습니다. 먼저 'uv sync' 를 실행해주세요."
    exit 1
fi

mkdir -p "$LOG_DIR"
DOCS_LOG="$LOG_DIR/embedding-docs.log"
CODE_LOG="$LOG_DIR/embedding-code.log"
: >"$DOCS_LOG"
: >"$CODE_LOG"

DOCS_PID=""
CODE_PID=""
TAIL_PID=""

cleanup() {
    echo
    echo "🛑 종료 — 두 임베딩 서버 정리 중..."
    if [[ -n "$TAIL_PID" ]] && kill -0 "$TAIL_PID" 2>/dev/null; then
        kill -TERM "$TAIL_PID" 2>/dev/null || true
    fi
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

# ── 1번 서버 (docs) — 서브쉘에서 exec 으로 uvicorn 으로 대체, stdout/err 파일로 ──
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

# ── 2번 서버 (code) — 동일 패턴, trust_remote_code=true 강제 ──────────────
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
echo "8초 후 두 프로세스 생존 확인..."
sleep 8

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

echo "✅ 두 프로세스 살아있음. 아래부터 두 로그가 prefix 와 함께 합쳐 흐릅니다."
echo "   각 서버가 'Embedding service ready' 찍으면 ready (모델 로드 ~30-60s)."
echo "   동작 확인: curl http://localhost:$DOCS_PORT/info  /  curl http://localhost:$CODE_PORT/info"
echo "   Ctrl-C 한 번으로 둘 다 종료됩니다."
echo "─────────────────────────────────────────────────────────────────"

# Foreground 으로 두 로그를 합쳐 보여줌. tail -F 가 파일을 따라가서
# uvicorn 이 추가 출력을 내면 바로 보임.
tail -F -q --pid="$DOCS_PID" "$DOCS_LOG" "$CODE_LOG" &
TAIL_PID=$!

# 두 서버 중 하나라도 살아있는 동안 계속 wait.
# wait $PID 는 그 자식이 끝날 때까지 block.
wait "$DOCS_PID" "$CODE_PID"
