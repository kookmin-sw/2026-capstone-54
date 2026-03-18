#!/bin/bash

# 모든 Django Management Commands 실행
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo
echo "Fetching all Django management commands..."
echo "(All available commands)"

# 모든 Django commands 가져오기
commands=($(
  docker-compose exec webapp python manage.py help --commands 2>/dev/null | grep -v "^\[" | awk '{print $1}' | sort
))

if [ ${#commands[@]} -eq 0 ]; then
  echo "No Django commands found or Docker is not running."
  exit 1
fi

echo
echo "Available Django management commands:"
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
