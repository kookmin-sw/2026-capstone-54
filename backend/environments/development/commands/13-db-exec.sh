#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

# SQL 명령어를 직접 실행
# 사용 예: bash environments/development/commands/db-exec.sh "CREATE EXTENSION IF NOT EXISTS vector;"

SQL_COMMAND="${1:-}"

if [ -z "$SQL_COMMAND" ]; then
  echo "Usage: $0 '<SQL_COMMAND>'"
  echo ""
  echo "Examples:"
  echo "  $0 'CREATE EXTENSION IF NOT EXISTS vector;'"
  echo "  $0 'CREATE EXTENSION IF NOT EXISTS pg_bigm;'"
  echo "  $0 '\\dx'  # List installed extensions"
  exit 1
fi

echo "Executing SQL: $SQL_COMMAND"
echo ""

# postgres 컨테이너 내부의 환경변수를 사용
dc exec postgres bash -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"$SQL_COMMAND\""
