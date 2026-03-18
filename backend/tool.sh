#!/usr/bin/env bash

set -euo pipefail

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
    createsuperuser)
      echo "슈퍼유저 생성 (createsuperuser)"
      ;;
    logs)
      echo "로그 스트리밍 (logs)"
      ;;
    makemigrations)
      echo "마이그레이션 생성 (makemigrations)"
      ;;
    migrate)
      echo "마이그레이션 적용 (migrate)"
      ;;
    shell)
      echo "Django Shell 접속 (shell)"
      ;;
    test)
      echo "테스트 실행 (test)"
      ;;
    custom_django_command)
      echo "커스텀 Django 명령어"
      ;;
    all_django_commands)
      echo "전체 Django 명령어"
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
  scripts+=("$script")
  base_name="$(basename "$script" .sh)"
  script_bases+=("$base_name")
  script_labels+=("$(friendly_label "$base_name")")
done < <(find "$COMMANDS_DIR" -maxdepth 1 -type f -name '*.sh' -print | sort)

docker_descriptions=(
  "docker-compose up -d --build (build & start)"
  "docker-compose up -d (start)"
  "docker-compose down (stop)"
)

docker_args=(
  "up -d --build"
  "up -d"
  "down"
)

show_menu() {
  local script_count=${#scripts[@]}
  local docker_count=${#docker_args[@]}

  echo
  echo "Available actions:"
  if [ $script_count -gt 0 ]; then
    for idx in "${!scripts[@]}"; do
      printf "  %2d) %s\n" $((idx + 1)) "${script_labels[$idx]}"
    done
  else
    echo "  (No command scripts found in environments/development/commands)"
  fi

  local docker_offset=$((script_count + 1))
  for idx in "${!docker_descriptions[@]}"; do
    printf "  %2d) %s\n" $((docker_offset + idx)) "${docker_descriptions[$idx]}"
  done
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
    logs)
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

run_docker() {
  local idx="$1"
  local description="${docker_descriptions[$idx]}"
  local args="${docker_args[$idx]}"

  echo
  echo "Running: $description"
  if (
    cd "$ROOT_DIR" || exit 1
    docker-compose $args
  ); then
    echo "Done."
  else
    local status=$?
    echo "Docker command exited with status $status"
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

    local selection=$((choice))
    local script_count=${#scripts[@]}
    local docker_count=${#docker_args[@]}
    local max_option=$((script_count + docker_count))

    if [ "$selection" -lt 1 ] || [ "$selection" -gt "$max_option" ]; then
      echo "Invalid selection."
      continue
    fi

    if [ "$selection" -le "$script_count" ]; then
      run_script $((selection - 1))
    else
      run_docker $((selection - script_count - 1))
    fi
  done
}

main
