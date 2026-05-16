#!/usr/bin/env bash
# Launch the standalone embedding service.
# Intended for a beefier machine on the LAN (e.g. a Mac Studio) so the
# booth-rag laptop can offload sentence-transformers inference.
#
# Env template for this script: .env.server.sample  (cp to .env on this machine).
# The booth-rag client uses .env.example instead.
#
# Single-model design — to serve two models (e.g. dual embedding: bge-m3
# for docs + CodeRankEmbed for code), launch this script TWICE with
# different EMBEDDING_LOCAL_MODEL and EMBEDDING_SERVER_PORT values.
#
# Usage (single — doc embedder):
#   bash scripts/run_embedding_server.sh                       # default 0.0.0.0:8080
#
# Usage (dual — run a separate code embedder on another port):
#   EMBEDDING_LOCAL_MODEL=nomic-ai/CodeRankEmbed \
#   EMBEDDING_TRUST_REMOTE_CODE=true \
#   EMBEDDING_SERVER_PORT=8081 \
#   bash scripts/run_embedding_server.sh
#
# The booth-rag client then sets:
#   EMBEDDING_BACKEND=remote
#   REMOTE_EMBEDDING_URL=http://<host>:8080         # docs
#   REMOTE_EMBEDDING_CODE_URL=http://<host>:8081    # code (optional, dual mode only)
#   RAG_DUAL_EMBEDDING=true

set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${EMBEDDING_SERVER_HOST:-0.0.0.0}"
PORT="${EMBEDDING_SERVER_PORT:-8080}"

echo "🚀 booth-rag embedding service"
echo "   ├─ bind:     $HOST:$PORT"
echo "   ├─ model:    ${EMBEDDING_LOCAL_MODEL:-(from .env)}"
echo "   ├─ trust_rc: ${EMBEDDING_TRUST_REMOTE_CODE:-false}"
echo "   └─ backend:  local (forced)"
echo

exec uv run uvicorn booth_rag.server.embedding_service:app \
  --host "$HOST" --port "$PORT" "$@"
