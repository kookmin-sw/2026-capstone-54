#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
exec uv run uvicorn booth_rag.main:app --host "${HOST:-127.0.0.1}" --port "${PORT:-8765}" --reload "$@"
