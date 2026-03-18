#!/bin/bash

# 커스텀 Django Management Commands만 실행
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# 커스텀 command 파일 목록 가져오기
commands=($(
  find "$ROOT_DIR/webapp" -type f -path "*/management/commands/*.py" -not -name "__init__.py" | \
    xargs -n1 basename | \
    sed 's/\.py$//' | \
    sort
))

if [ ${#commands[@]} -eq 0 ]; then
  echo "No custom Django commands found."
  exit 1
fi

echo
echo "Available custom Django management commands:"
for idx in "${!commands[@]}"; do
  printf "  %2d) %s\n" $((idx + 1)) "${commands[$idx]}"
done

read -r -p "Select a Django command: " choice || exit 1

if [[ ! "$choice" =~ ^[0-9]+$ ]]; then
  echo "Invalid selection."
  exit 1
fi

cmd_idx=$((choice - 1))
if [ "$cmd_idx" -lt 0 ] || [ "$cmd_idx" -ge ${#commands[@]} ]; then
  echo "Invalid selection."
  exit 1
fi

command="${commands[$cmd_idx]}"

read -r -p "Arguments for '${command}' (optional, space separated): " args_line || exit 1

echo
echo "Running: python manage.py ${command}${args_line:+ $args_line}"

if [ -n "$args_line" ]; then
  docker-compose exec webapp python manage.py "$command" $args_line
else
  docker-compose exec webapp python manage.py "$command"
fi
