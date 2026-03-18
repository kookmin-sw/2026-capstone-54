#!/bin/bash

set -euo pipefail

export MSYS_NO_PATHCONV=1
if docker compose version >/dev/null 2>&1; then
  dc() { docker compose "$@"; }
else
  dc() { docker-compose "$@"; }
fi

dc exec webapp python manage.py createsuperuser "$@"
