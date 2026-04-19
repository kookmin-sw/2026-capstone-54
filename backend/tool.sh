#!/usr/bin/env bash

set -euo pipefail

# Windows Git Bash: Unix 경로가 Windows 경로로 자동 변환되는 것을 방지
export MSYS_NO_PATHCONV=1

# Docker Desktop v4+ 는 'docker compose' (플러그인)를 권장
# 구버전 호환을 위해 'docker-compose' (standalone) 도 fallback 지원
if docker compose version >/dev/null 2>&1; then
  dc() { docker compose "$@"; }
else
  dc() { docker-compose "$@"; }
fi
export -f dc

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
COMMANDS_DIR="$ROOT_DIR/environments/development/commands"

if [ ! -d "$COMMANDS_DIR" ]; then
  echo "Command directory not found: $COMMANDS_DIR" >&2
  exit 1
fi

friendly_label() {
  local base="$1"
  case "$base" in
    01-all_django_commands)
      echo "전체 Django 명령어"
      ;;
    02-createsuperuser)
      echo "슈퍼유저 생성 (createsuperuser)"
      ;;
    03-custom_django_command)
      echo "커스텀 Django 명령어"
      ;;
    04-logs)
      echo "로그 스트리밍 (logs)"
      ;;
    05-makemigrations)
      echo "마이그레이션 생성 (makemigrations)"
      ;;
    06-migrate)
      echo "마이그레이션 적용 (migrate)"
      ;;
    07-shell)
      echo "Django Shell 접속 (shell)"
      ;;
    08-test)
      echo "테스트 실행 (test)"
      ;;
    09-docker-build-start)
      echo "docker-compose up -d --build (build & start)"
      ;;
    10-docker-start)
      echo "docker-compose up -d (start)"
      ;;
    11-docker-stop)
      echo "docker-compose down (stop)"
      ;;
    12-db-console)
      echo "PostgreSQL 콘솔 접속 (db-console)"
      ;;
    13-db-exec)
      echo "SQL 명령어 실행 (db-exec)"
      ;;
    14-sqs-worker-start)
      echo "SQS Celery Worker 시작 (sqs-worker)"
      ;;
    *)
      echo "$base ($base)"
      ;;
  esac
}

scripts=()
script_labels=()
script_bases=()
while IFS= read -r script; do
  [ -z "$script" ] && continue
  base_name="$(basename "$script" .sh)"
  # _common.sh는 제외
  [[ "$base_name" == _* ]] && continue
  scripts+=("$script")
  script_bases+=("$base_name")
  script_labels+=("$(friendly_label "$base_name")")
done < <(find "$COMMANDS_DIR" -maxdepth 1 -type f -name '*.sh' -print | sort)

show_menu() {
  local script_count="${#scripts[@]}"

  echo
  echo "Available actions:"
  if [ "$script_count" -gt 0 ]; then
    for idx in "${!scripts[@]}"; do
      printf "  %2d) %s\n" "$((idx + 1))" "${script_labels[$idx]}"
    done
  else
    echo "  (No command scripts found in environments/development/commands)"
  fi
  echo "  q) Quit"
}

run_script() {
  local idx="$1"
  local script="${scripts[$idx]}"
  local label="${script_labels[$idx]}"
  local base="${script_bases[$idx]}"

  echo
  echo "Selected script: $label"

  local prompt_for_args=true
  case "$base" in
    04-logs|09-docker-build-start|10-docker-start|11-docker-stop|12-db-console|14-sqs-worker-start)
      prompt_for_args=false
      ;;
  esac

  local args_line=""
  local -a args=()
  if [ "$prompt_for_args" = true ]; then
    read -r -p "Arguments (optional, space separated; quotes supported): " args_line || return

    if [[ -n ${args_line// /} ]]; then
      if eval "args=( ${args_line} )"; then
        :
      else
        echo "Could not parse arguments. Please try again."
        return
      fi
    fi
  fi

  local display_path="${script#$ROOT_DIR/}"
  echo "Running: bash $display_path${args_line:+ $args_line}"
  if (
    cd "$ROOT_DIR" || exit 1
    if [ ${#args[@]} -gt 0 ]; then
      bash "$script" "${args[@]}"
    else
      bash "$script"
    fi
  ); then
    echo "Done."
  else
    local status=$?
    echo "Command exited with status $status"
  fi
}

main() {
  while true; do
    show_menu
    read -r -p "Select an option: " choice || break

    case "$choice" in
      q|Q)
        echo "Bye!"
        break
        ;;
      *)
        if [[ ! "$choice" =~ ^[0-9]+$ ]]; then
          echo "Please enter a number or 'q' to quit."
          continue
        fi
        ;;
    esac

    local selection="$((choice))"
    local script_count="${#scripts[@]}"
    local max_option="$script_count"

    if [ "$selection" -lt 1 ] || [ "$selection" -gt "$max_option" ]; then
      echo "Invalid selection."
      continue
    fi

    run_script "$((selection - 1))"
  done
}

main
