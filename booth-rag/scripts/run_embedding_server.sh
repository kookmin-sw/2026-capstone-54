#!/usr/bin/env bash
# Launch the standalone embedding service.
# Intended for a beefier machine on the LAN (e.g. a Mac Studio) so the
# booth-rag laptop can offload sentence-transformers inference.
#
# Usage:
#   bash scripts/run_embedding_server.sh                       # default 0.0.0.0:8080
#   EMBEDDING_SERVER_PORT=9000 bash scripts/run_embedding_server.sh
#   bash scripts/run_embedding_server.sh --reload              # passes through to uvicorn

set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${EMBEDDING_SERVER_HOST:-0.0.0.0}"
PORT="${EMBEDDING_SERVER_PORT:-8080}"

echo "🚀 booth-rag embedding service"
echo "   ├─ bind:     $HOST:$PORT"
echo "   ├─ model:    ${EMBEDDING_LOCAL_MODEL:-(from .env)}"
echo "   └─ backend:  local (forced)"
echo

exec uv run uvicorn booth_rag.server.embedding_service:app \
  --host "$HOST" --port "$PORT" "$@"
