#!/bin/bash

export MSYS_NO_PATHCONV=1
if docker compose version >/dev/null 2>&1; then
  dc() { docker compose "$@"; }
else
  dc() { docker-compose "$@"; }
fi

APP_NAME="${1:-}"

if [ -z "$APP_NAME" ]; then
  dc exec webapp python manage.py makemigrations
else
  dc exec webapp python manage.py makemigrations "$APP_NAME"
fi
