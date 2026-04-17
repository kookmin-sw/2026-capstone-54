#!/bin/bash

# 공통 설정 및 함수
# 모든 command 스크립트에서 source로 불러와 사용

export MSYS_NO_PATHCONV=1

if docker compose version >/dev/null 2>&1; then
  dc() { docker compose "$@"; }
else
  dc() { docker-compose "$@"; }
fi

export -f dc

# 테스트 DB 정리 함수
drop_test_db() {
  local db_user="$1"
  local db_name="$2"

  # 연결된 세션 종료
  dc exec -T postgres psql -U "$db_user" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db_name' AND pid <> pg_backend_pid();" 2>/dev/null || true

  # DB 드롭
  dc exec -T postgres psql -U "$db_user" -d postgres -c "DROP DATABASE IF EXISTS $db_name;" 2>/dev/null || true

  echo "Test database '$db_name' dropped"
}

# 테스트 DB가 존재하면 드롭
cleanup_test_db() {
  # docker-compose의 postgres 서비스에서 환경변수 읽기
  local db_user=$(dc exec -T postgres printenv POSTGRES_USER 2>/dev/null)
  local db_name="${TEST_DATABASE_NAME:-test_team_four_db}"

  if [ -z "$db_user" ]; then
    echo "Warning: Could not read POSTGRES_USER from postgres container"
    return 1
  fi

  # DB 존재 확인
  exists=$(dc exec -T postgres psql -U "$db_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$db_name';" 2>/dev/null)

  if [ "$exists" = "1" ]; then
    echo "Test database '$db_name' exists. Dropping..."
    drop_test_db "$db_user" "$db_name"
  fi
}
