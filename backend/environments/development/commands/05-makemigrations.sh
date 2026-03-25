#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

APP_NAME="${1:-}"

if [ -z "$APP_NAME" ]; then
  dc exec webapp python manage.py makemigrations
else
  dc exec webapp python manage.py makemigrations "$APP_NAME"
fi
