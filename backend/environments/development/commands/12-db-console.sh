#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

# PostgreSQL 콘솔에 접속
# 사용 예: ./tool.sh 에서 선택하거나
# bash environments/development/commands/12-db-console.sh

echo "Connecting to PostgreSQL console..."
echo "Tip: Use \q to exit"
echo ""

# postgres 컨테이너 내부의 환경변수를 사용
dc exec postgres bash -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
